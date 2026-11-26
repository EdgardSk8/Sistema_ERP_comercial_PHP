/* Genera el par de claves VAPID que usan las notificaciones push.
   - La PÚBLICA va en website-supabase/js/core/supabase-config.js (window.PUSH_CONFIG.clavePublica).
   - La PRIVADA se guarda como secreto en Supabase: VAPID_PRIVATE_KEY (Edge Function enviar-push).
   Uso: node scripts/generar-claves-push.mjs */

import { generateKeyPairSync } from 'node:crypto';

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const jwk = privateKey.export({ format: 'jwk' });

const aBytes = (valor) => Buffer.from(valor, 'base64url');
const publica = Buffer.concat([Buffer.from([0x04]), aBytes(jwk.x), aBytes(jwk.y)]).toString('base64url');

console.log('');
console.log('VAPID_PUBLIC_KEY=' + publica);
console.log('VAPID_PRIVATE_KEY=' + jwk.d);
console.log('');
console.log('Guarda la privada en Supabase → Edge Functions → Secrets y en tu gestor de contraseñas.');
console.log('Si cambias estas claves, los usuarios deben volver a activar las notificaciones.');
