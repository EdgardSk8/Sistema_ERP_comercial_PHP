/**
 * Convierte los comentarios de una publicación de Instagram en la lista
 * de participantes de la ruleta (website-supabase/data/ruleta-instagram.json).
 *
 * Uso:
 *   node scripts/importar-comentarios-instagram.mjs comentarios.json \
 *     --publicacion=https://www.instagram.com/p/XXXX/
 *
 * Acepta tres formatos de entrada:
 *   1. Respuesta de la API de Instagram: { "data": [{ "username": "..." }] }
 *   2. Arreglo de textos: ["ana", "@beto comentó"]
 *   3. Texto plano o CSV: un comentario por línea
 *
 * En los formatos 2 y 3 se toma el primer @usuario de cada línea; si no hay
 * @, se usa la primera palabra. Los nombres se deduplican sin distinguir
 * mayúsculas y se ordenan alfabéticamente.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = resolve(RAIZ, 'website-supabase/data/ruleta-instagram.json');

const argumentos = process.argv.slice(2);
const entrada = argumentos.find((arg) => !arg.startsWith('--'));
const publicacion = argumentos.find((arg) => arg.startsWith('--publicacion='))?.split('=').slice(1).join('=');

if (!entrada) {
    console.error('Falta el archivo de comentarios.\n');
    console.error('  node scripts/importar-comentarios-instagram.mjs comentarios.json --publicacion=https://www.instagram.com/p/XXXX/');
    process.exit(1);
}

const limpiar = (valor) => String(valor ?? '').trim().replace(/^@+/, '');

function desdeJson(datos) {
    const lista = Array.isArray(datos) ? datos : datos?.data;

    if (!Array.isArray(lista)) return null;

    return lista.map((item) => {
        if (typeof item === 'string') return item;

        return item?.username ?? item?.usuario ?? item?.text ?? item?.texto ?? '';
    });
}

function desdeTexto(texto) {
    return texto
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter(Boolean)
        .map((linea) => {
            const mencion = linea.match(/@([\w.]+)/);

            if (mencion) return mencion[1];

            return linea.split(/[\s,;]+/)[0];
        });
}

const contenido = await readFile(resolve(process.cwd(), entrada), 'utf8');
let crudos = null;

if (entrada.toLowerCase().endsWith('.json')) {
    try {
        crudos = desdeJson(JSON.parse(contenido));
    } catch (error) {
        console.error(`No se pudo leer el JSON: ${error.message}`);
        process.exit(1);
    }
}

if (!crudos) crudos = desdeTexto(contenido);

const vistos = new Map();

crudos.forEach((valor) => {
    const nombre = limpiar(valor);

    if (!nombre) return;

    const clave = nombre.toLowerCase();

    if (!vistos.has(clave)) vistos.set(clave, nombre);
});

const participantes = [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'));

let previo = {};

try {
    previo = JSON.parse(await readFile(SALIDA, 'utf8'));
} catch {
    previo = {};
}

const salida = {
    nota: previo.nota || 'Participantes de Instagram: un @usuario por entrada.',
    publicacion: publicacion ?? previo.publicacion ?? '',
    actualizado: new Date().toISOString(),
    participantes,
};

await writeFile(SALIDA, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');

console.log(`${participantes.length} participantes escritos en website-supabase/data/ruleta-instagram.json`);
