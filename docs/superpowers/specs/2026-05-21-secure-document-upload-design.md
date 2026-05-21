# Secure Document Upload — Design

## Problem

Documents currently only support external URL references (`url String`). There is no way to upload files directly into the application. This limits usability — users must host files externally and paste URLs.

## Scope

Add real file upload via Supabase Storage while keeping the existing URL-based workflow retrocompatible. Security is the primary concern: `INTERNAL` documents must never be publicly accessible.

## Architecture Decisions

### 1. Storage Model

| Decision | Rationale |
|----------|-----------|
| **Bucket privado `documents`** | Nunca expor arquivos diretamente. Todo acesso passa por server-side. |
| **Upload sempre server-side** | `SUPABASE_SERVICE_ROLE_KEY` nunca chega ao cliente. Upload via server action. |
| **`SUPABASE_SERVICE_ROLE_KEY` server-only** | Usado exclusivamente em server actions e route handlers. |
| **URL externa retrocompatível** | Documentos existentes com `url` externo continuam funcionando. |
| **Distinguir upload interno de URL externa** | Campo `storagePath` no banco indica se o arquivo está no storage. |

### 2. Schema Changes — Document Model

Current:
```prisma
model Document {
  id          String             @id @default(cuid())
  tenantId    String
  externalKey String?
  serviceId   String
  proposalId  String?
  title       String
  url         String
  visibility  DocumentVisibility @default(INTERNAL)
  mimeType    String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  ...
}
```

Proposed additions:
```prisma
model Document {
  ...
  url         String
  visibility  DocumentVisibility @default(INTERNAL)
  mimeType    String?
  storagePath String?           // path no bucket Supabase, null = URL externa
  fileName    String?           // nome original do arquivo (sanitizado)
  fileSize    Int?              // tamanho em bytes
  uploadedAt  DateTime?         // quando o upload foi feito
  ...
}
```

**Why these fields:**
- `storagePath` — o indicador primário de "este documento é um upload interno". Se null, `url` é externo.
- `fileName` — nome original para display e download com nome correto.
- `fileSize` — informação útil para o usuário, validação de limites.
- `uploadedAt` — rastreabilidade do upload.
- `url` mantido — para compatibilidade com URLs externas e para documentos internos, pode receber uma rota interna segura como `/api/documents/{documentId}/download`.

### 3. Storage Path Structure

```
{tenantId}/{serviceId}/{documentId}-{safeFileName}
```

Exemplo:
```
documents/cmp4u9lpe0001r07ntenjarud/cmp4ua1b2c3d4e5f6g7h8i9j0/doc-abc123-memorial-descritivo.pdf
```

**Regras:**
- Sanitizar nome do arquivo: remover caracteres especiais, espaços → hífens, lowercase.
- Manter extensão original.
- Nunca usar nome original sem sanitização.
- `documentId` no path garante unicidade.

### 4. File Validation

| Regra | Valor |
|-------|-------|
| Tamanho máximo | 10 MB (10,485,760 bytes) |
| Tipos aceitos | PDF, PNG, JPG/JPEG, DOCX, XLSX, DWG |
| MIME types | `application/pdf`, `image/png`, `image/jpeg`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/acad`, `application/dwg` |
| Extensões | `.pdf`, `.png`, `.jpg`, `.jpeg`, `.docx`, `.xlsx`, `.dwg` |
| Validação dupla | Verificar MIME type E extensão — ambos devem bater |

### 5. Upload Flow

```
Client (File input)
  ↓
  FormData { file, title, visibility, mimeType }
  ↓
Server Action: uploadDocument(tenantId, formData)
  ↓
  1. Validate file (size, MIME, extension)
  2. Sanitize file name
  3. Create Document record in DB (pending upload)
  4. Upload to Supabase Storage via service role
  5. Update Document with storagePath, fileName, fileSize, uploadedAt
  6. Return { redirectUrl: /documents/{id} }
```

**Importante:** O registro no banco é criado antes do upload. Se o upload falhar, o documento fica com `storagePath = null` e `url` apontando para uma rota interna que retorna erro. Isso evita perda de dados parciais.

### 6. Download/Preview — Access Control

#### INTERNAL Documents
- Acesso somente por usuário autenticado do tenant.
- Rota: `GET /api/documents/{documentId}/download`
- Verificar: usuário tem membership no tenant do documento.
- Retornar: stream do arquivo via Supabase Storage (service role).
- Headers: `Content-Disposition: attachment` ou `inline` para preview.

#### CLIENT_VISIBLE Documents
- Podem aparecer no portal do cliente.
- Acesso via rota server-side com validação de portal token.
- Rota: `GET /api/documents/{documentId}/portal-download?token={portalToken}`
- Verificar: token válido, portal ativo, documento é CLIENT_VISIBLE, documento pertence ao serviço do token.
- Retornar: stream do arquivo.
- **Alternativa:** signed URL com expiração curta (15 min).

#### SUPPLIER_VISIBLE Documents
- Preparado para futuro portal de fornecedor.
- Sem implementação neste bloco.

### 7. Preview Strategy

| Tipo | Comportamento |
|------|---------------|
| PDF | `<iframe>` via rota segura ou link de download |
| Imagem (PNG/JPG) | `<img>` via rota segura ou signed URL curta |
| Outros (DOCX, XLSX, DWG) | Link de download |

### 8. Portal do Cliente — Documents

- Mostrar apenas documentos `CLIENT_VISIBLE`.
- Links de documento devem funcionar sem login interno.
- Acesso validado via portal token.
- Não permitir acesso a documentos `INTERNAL` via portal.
- URL do documento no portal: `/api/documents/{documentId}/portal-download?token={portalToken}`

### 9. URL Strategy

| Tipo | url | storagePath |
|------|-----|-------------|
| URL externa (existente) | `https://exemplo.com/doc.pdf` | `null` |
| Upload interno | `/api/documents/{id}/download` | `{tenantId}/{serviceId}/{id}-{name}` |

Para documentos internos, `url` recebe a rota interna de download. Isso mantém compatibilidade com o campo `url` existente e permite que o `DocumentDetail` e `DocumentList` continuem funcionando sem mudanças significativas.

### 10. Environment Variables

| Variable | Scope | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` ou `SUPABASE_URL` | Server | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Sim |
| `SUPABASE_STORAGE_BUCKET` | Server | Não (default: `documents`) |

**Regra de segurança:** `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser exposto no frontend. Prefix `NEXT_PUBLIC_` não deve ser usado para esta variável.

### 11. Bucket Configuration

- Nome: `documents`
- Acesso: privado (não público)
- RLS: desabilitado (acesso via service role apenas)
- Não criar URL pública permanente para nenhum arquivo

### 12. Retrocompatibilidade

- Documentos existentes com `url` externo continuam funcionando sem alteração.
- `storagePath` é `null` para documentos existentes.
- `DocumentForm` deve oferecer duas opções: upload de arquivo OU URL externa.
- `DocumentDetail` deve detectar se é upload interno ou URL externa e renderizar adequadamente.

### 13. Error Handling

| Erro | Ação |
|------|------|
| Arquivo > 10MB | Rejeitar com mensagem "Arquivo muito grande (máx. 10MB)" |
| Tipo não aceito | Rejeitar com mensagem "Tipo de arquivo não suportado" |
| MIME/extension mismatch | Rejeitar com mensagem "Tipo de arquivo inválido" |
| Upload falha no storage | Reverter documento ou marcar como "upload pendente" |
| Documento não encontrado | 404 |
| Acesso não autorizado | 403 |

### 14. Test Strategy

#### Unit Tests
- Validação de arquivo (tamanho, tipo, MIME, extensão)
- Sanitização de nome de arquivo
- Geração de storage path
- Autorização de download (INTERNAL vs CLIENT_VISIBLE)
- Upload action (mock Supabase)

#### E2E Tests
- Upload de PDF via DocumentForm → visualizar no DocumentDetail
- Listagem de documentos com upload interno
- Portal acessando documento CLIENT_VISIBLE
- Portal NÃO acessando documento INTERNAL
- Token inválido no portal → 404 no download

## Risks

| Risco | Mitigação |
|-------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` exposto | Server actions only, nunca no cliente |
| Arquivo malicioso | Validação MIME + extensão + tamanho |
| Bucket público acidental | Configuração manual, verificar via CLI |
| Performance com arquivos grandes | Limite de 10MB, stream direto do storage |
| Documents com storagePath mas upload falhou | Validar no download, retornar erro claro |
| Signed URL expirada | Regenerar on-demand via server action |

## Future Considerations (out of scope)

- Preview inline de PDF no browser (usar iframe com rota segura)
- Portal de fornecedor com acesso a SUPPLIER_VISIBLE
- Versionamento de documentos
- OCR / extração de texto de PDFs
- Integração com AI para análise de documentos
