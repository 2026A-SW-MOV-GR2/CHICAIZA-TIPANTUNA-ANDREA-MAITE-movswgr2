declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;

import { BookRepository } from "../app/core/data/book-repository";
import { SqlRepository } from "../app/core/data/sql-repository";
import { NoSqlRepository } from "../app/core/data/nosql-repository";
import { Book } from "../app/core/data/books-data";

const sampleBook: Omit<Book, "id"> = {
    title: "Libro de prueba",
    author: "Autor local",
    status: "Pendiente",
    image: "https://example.com/libro.png"
};

const seededBook: Book = {
    id: 1,
    title: "Semilla",
    author: "Sistema",
    status: "Leído",
    image: "https://example.com/semilla.png"
};

describe("Persistencia Dual (Suite de Pruebas Unitarias)", () => {
    let sqlWrites: Array<Omit<Book, "id">>;
    let noSqlWrites: Array<Omit<Book, "id">>;
    let originalSqlGetBooks: typeof SqlRepository.prototype.getBooks;
    let originalSqlAddBook: typeof SqlRepository.prototype.addBook;
    let originalNoSqlGetBooks: typeof NoSqlRepository.prototype.getBooks;
    let originalNoSqlAddBook: typeof NoSqlRepository.prototype.addBook;

    beforeEach(() => {
        (BookRepository as any).instance = undefined;

        sqlWrites = [];
        noSqlWrites = [];

        originalSqlGetBooks = SqlRepository.prototype.getBooks;
        originalSqlAddBook = SqlRepository.prototype.addBook;
        originalNoSqlGetBooks = NoSqlRepository.prototype.getBooks;
        originalNoSqlAddBook = NoSqlRepository.prototype.addBook;

        SqlRepository.prototype.getBooks = async () => [seededBook];
        SqlRepository.prototype.addBook = async (book) => {
            sqlWrites.push(book);
        };
        NoSqlRepository.prototype.getBooks = async () => [seededBook];
        NoSqlRepository.prototype.addBook = async (book) => {
            noSqlWrites.push(book);
        };
    });

    afterEach(() => {
        SqlRepository.prototype.getBooks = originalSqlGetBooks;
        SqlRepository.prototype.addBook = originalSqlAddBook;
        NoSqlRepository.prototype.getBooks = originalNoSqlGetBooks;
        NoSqlRepository.prototype.addBook = originalNoSqlAddBook;
        (BookRepository as any).instance = undefined;
    });

    it("Debería escribir en SQLite cuando el modo es relacional", async () => {
        const repository = BookRepository.getInstance();

        expect(repository.isUsingSql()).toBeTrue();

        await repository.addBook(sampleBook);

        expect(sqlWrites).toEqual([sampleBook]);
        expect(noSqlWrites).toEqual([]);
    });

    it("Debería cambiar a NoSQL y escribir en ese motor", async () => {
        const repository = BookRepository.getInstance();

        repository.setMode(false);

        expect(repository.isUsingSql()).toBeFalse();

        await repository.addBook(sampleBook);

        expect(noSqlWrites).toEqual([sampleBook]);
        expect(sqlWrites).toEqual([]);
    });
});
