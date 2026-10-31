export const PRODUCTS = [
  "City Paver 50 mm (Gray)",
  "City Paver 50 mm (Gray) (7000 PSI)",
  "City Paver 50 mm (Top Red) (7000 PSI)",
  "City Paver 50 mm (Top Red)",
  "City Paver 50 mm (Top Black)",
  "City Paver 60 mm (Gray 3000 PSI)",
  "City Paver 60 mm (Gray 5000 PSI)",
  "City Paver 60 mm (Top Red) 5000 PSI",
  "City Paver 60 mm  7000 (Gray)",
  "City Paver 60 mm (Top Orange )",
  "City 60 mm Yellow (5000psi)",
  "City Paver 60 mm (Top light Orange )",
  "City Paver 60 mm black (7000 PSI)",
  "City Paver 60 mm (Top Black)(5000)psi",
  "City Paver 60 mm (Top Red)",
  "City Paver 80 mm (Gray) (5000) psi",
  "City Paver 80 mm (Gray) SPC",
  "City Paver 80 mm (Top Red) (5000 PSI)",
  "City Paver 80 mm (Top Red) SPC",
  "City Paver 80 mm (Full Red) Block factory",
  "City 80 MM BLACK 7000 PSI",
  "City 80 MM  7000 PSI  YELLOW",
  "City 80 MM  7000 PSI  GREEN",
  "City 80 MM ( 5000PSI) TOP BLACK",
  "Uni Paver 60 mm (Gray)",
  "Uni Paver 60 mm  (5000 PSI) (Gray)",
  "Uni Paver 60 mm Top (5000 Psi) (Red)",
  "Uni Paver 60 mm (7000 PSI) (Top Black)",
  "Uni Paver 80 mm (Gray)",
  "Uni Paver 80 mm(5000) (Gray)",
  "Uni Paver 80 mm (top red)",
  "Uni Paver 80 mm (Red) (Block Factory)",
  "Uni Paver 80 mm (Red)",
  "Uni Paver 80 mm (Top Black)",
  "Uni Paver 60 mm  (7000 PSI) Red",
  "Sq Tile 8\"x 8\" 50 mm (Gray )",
  "Sq Tile 8\"x 8\" 50 mm (Red )",
  "Sq Tile 8\"x 8\" 60 mm (Gray ) Block Factory",
  "Sq Tile 8\"x 8\" 60 mm (Top Red )",
  "QUADRA PAVER",
  "Quadro Paver 60 mm ( Gray )",
  "Quadro Paver 60 mm (Top Red) 5000 PSI",
  "Quadro Paver 60 mm (Top BLACK) 5000 PSI",
  "I - Section 60 mm Gray",
  "I- Section 60 mm (5000 PSI) Paver",
  "I - Section 60 mm Top Red (5000 PSI) Block",
  "I - Section 60 mm Top Red (5000 PSI)",
  "Cobal 60mm Grey ( 5000 PSI )",
  "Cobal 60mm Red ( 5000 PSI )",
  "Cobal 60mm White ( 5000 PSI )",
  "Cobal 60mm Yellow ( 5000 PSI )",
  "Cobal 60mm Black ( 5000 PSI )",
  "Curbstone 14\" (B-Pair)",
  "Curbstone 18\" (B-Pair)",
  "Solid Block 6x8x12",
  "Solid Block 4x8x12",
  "B-Pair Solid Block",
  "K-2",
  "Hallow Block",
  "Hallow Block 4X8X16 ( B-Pair)",
  "Eco Brick - Red - Hole",
  "Eco Brick - Grey - Hole",
  "Eco Brick - Inter Lock",
  "Eco Brick SC - Grey",
  "Eco Brick - 3 Hole"
];

export function getCategory(product) {
  if (product.startsWith("City Paver") || product.startsWith("City ")) return "CITY PAVER";
  if (product.startsWith("Uni Paver")) return "UNI PAVER";
  if (product.startsWith("Sq Tile")) return "SQ.TILE";
  if (product.startsWith("Quadro") || product.startsWith("QUADRA")) return "QUADRO PAVER";
  if (product.startsWith("I - Section") || product.startsWith("I- Section") || product.startsWith("Cobal")) return "I SECTION";
  if (["Curbstone", "Solid Block", "B-Pair", "K-2", "Hallow", "Eco Brick"].some(prefix => product.startsWith(prefix))) return "BLOCKS & OTHERS";
  return "OTHER";
}

export const CATEGORIES = [
  "CITY PAVER", "UNI PAVER", "SQ.TILE", "QUADRO PAVER", "I SECTION", "BLOCKS & OTHERS"
];
