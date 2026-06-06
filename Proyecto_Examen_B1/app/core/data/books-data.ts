/** Modelo de datos de un libro. El id es asignado por el motor de persistencia */
export interface Book {
    id: number;
    title: string;
    author: string;
    status: 'Leído' | 'Leyendo' | 'Pendiente'; // Estados posibles de lectura
    image: string; // URL de portada
}

/** Datos semilla para poblar ambos motores en el primer arranque */
export const BOOKS: Book[] = [
    { id: 1, title: "Cien años de soledad", author: "Gabriel García Márquez", status: "Leído", image: "https://m.media-amazon.com/images/I/81rEWmLXliL._AC_UF1000,1000_QL80_.jpg" },
    { id: 2, title: "Hábitos Atómicos", author: "James Clear", status: "Leyendo", image: "https://img1.od-cdn.com/ImageType-100/5822-1/%7B466951F0-BA86-4EC8-B150-2A0417331CF2%7DIMG100.JPG" },
    { id: 3, title: "Clean Code", author: "Robert C. Martin", status: "Pendiente", image: "https://images.cdn3.buscalibre.com/fit-in/360x360/10/fb/10fb170d7732b7dca25ebb81ded2572d.jpg" }
];