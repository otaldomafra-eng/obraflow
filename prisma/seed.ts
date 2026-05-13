async function main() {
  console.log("ObraFlow seed: no-op bootstrap seed completed.");
}

main().catch((error) => {
  console.error("ObraFlow seed failed:", error);
  process.exit(1);
});
