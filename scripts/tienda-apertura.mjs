#!/usr/bin/env node
/**
 * Abre o cierra la tienda con el interruptor TIENDA_APERTURA.
 *
 * Uso:
 *   node scripts/tienda-apertura.mjs estado    → muestra el estado actual
 *   node scripts/tienda-apertura.mjs abrir     → activa: false (tienda vendiendo)
 *   node scripts/tienda-apertura.mjs cerrar    → activa: true  (antes de abrir)
 *
 * Además sube el ?v= de supabase-config.js en todos los HTML: si no se sube,
 * el navegador puede seguir usando la copia anterior del archivo de config.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const tienda = join(raiz, 'website-supabase');
const configRuta = join(tienda, 'js', 'core', 'supabase-config.js');

const accion = (process.argv[2] || 'estado').toLowerCase();

function leer() {
    return readFileSync(configRuta, 'utf8');
}

function estadoActual(texto) {
    const bloque = texto.match(/window\.TIENDA_APERTURA\s*=\s*\{[^}]*\}/);
    if (!bloque) return null;
    const activa = /activa\s*:\s*(true|false)/.exec(bloque[0]);
    return activa ? activa[1] === 'true' : null;
}

function fechaHoy() {
    const d = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}`;
}

function siguienteVersion(actual) {
    const hoy = fechaHoy();
    const m = /^(\d{8})([a-z])$/.exec(actual || '');

    if (!m || m[1] !== hoy) return hoy + 'a';
    if (m[2] === 'z') return hoy + 'a';

    return hoy + String.fromCharCode(m[2].charCodeAt(0) + 1);
}

function versionActualConfig() {
    const index = readFileSync(join(tienda, 'index.html'), 'utf8');
    const m = /supabase-config\.js\?v=([0-9a-z]+)/.exec(index);
    return m ? m[1] : '';
}

function archivosHtml(carpeta) {
    const salida = [];

    for (const nombre of readdirSync(carpeta)) {
        if (nombre === '_backup' || nombre === 'node_modules') continue;

        const ruta = join(carpeta, nombre);

        if (statSync(ruta).isDirectory()) {
            salida.push(...archivosHtml(ruta));
        } else if (extname(nombre).toLowerCase() === '.html') {
            salida.push(ruta);
        }
    }

    return salida;
}

function subirVersion() {
    const nueva = siguienteVersion(versionActualConfig());
    let cambios = 0;

    for (const ruta of archivosHtml(tienda)) {
        const texto = readFileSync(ruta, 'utf8');
        const nuevo = texto.replace(/supabase-config\.js\?v=[0-9a-z]+/g, `supabase-config.js?v=${nueva}`);

        if (nuevo !== texto) {
            writeFileSync(ruta, nuevo, 'utf8');
            cambios += 1;
        }
    }

    return { nueva, cambios };
}

function aplicar(valor) {
    const texto = leer();
    const actual = estadoActual(texto);

    if (actual === null) {
        console.error('No encontré el bloque window.TIENDA_APERTURA en supabase-config.js');
        process.exit(1);
    }

    if (actual === valor) {
        console.log(`La tienda ya está en modo ${valor ? 'cerrado (antes de abrir)' : 'abierto'}. Sin cambios.`);
        return;
    }

    const nuevo = texto.replace(
        /(window\.TIENDA_APERTURA\s*=\s*\{[^}]*?activa\s*:\s*)(true|false)/,
        `$1${valor}`
    );

    writeFileSync(configRuta, nuevo, 'utf8');

    const { nueva, cambios } = subirVersion();

    console.log(`Listo: TIENDA_APERTURA.activa = ${valor}`);
    console.log(`Versión de supabase-config.js: ${nueva} (${cambios} HTML actualizados)`);
    console.log('Recuerda desplegar los cambios para que lleguen a la tienda.');
}

const actual = estadoActual(leer());

if (actual === null) {
    console.error('No encontré el bloque window.TIENDA_APERTURA en supabase-config.js');
    process.exit(1);
}

if (accion === 'abrir') {
    aplicar(false);
} else if (accion === 'cerrar') {
    aplicar(true);
} else if (accion === 'estado') {
    console.log(
        actual
            ? 'Modo antes de abrir: la tienda no vende, no permite cuentas y muestra la cuenta atrás.'
            : 'Tienda abierta: banner del 10%, cuentas y botones de compra visibles.'
    );
    console.log(`Versión actual de supabase-config.js: ${versionActualConfig()}`);
} else {
    console.error('Uso: node scripts/tienda-apertura.mjs [estado|abrir|cerrar]');
    process.exit(1);
}
