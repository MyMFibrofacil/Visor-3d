export const catalog = {
  "picky-kids": {
    name: "Picky Kids",
    client: "Victoria Bongiovanni",
    description: "Muebles infantiles a medida",
    furniture: {
      "mesa-y-sillas-emi": { name: "Mesa y Sillas Emi", description: "Mesa infantil y dos sillas", status: "Disponible", title: "Mesa y Sillas Emi" },
      "librero-emi": { name: "Librero Emi", description: "Librero infantil con manija", status: "Borrador", title: "Librero Emi" },
      "cama-montessori-emi": { name: "Cama Montessori Emi", description: "Cama infantil con acceso bajo y barandas", status: "Disponible", title: "Cama Montessori Emi" }
    }
  }
};
export const defaultClient = "picky-kids";
export const defaultFurniture = "mesa-y-sillas-emi";
export function getProduct(clientSlug, furnitureSlug) { const client=catalog[clientSlug]; const furniture=client?.furniture[furnitureSlug]; return client&&furniture?{clientSlug,furnitureSlug,client,furniture}:null; }
