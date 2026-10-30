<?php

namespace App\Services;

use Carbon\Carbon;

/**
 * Genera el ticket de facturación en ESC/POS puro (58 mm / 32 columnas) y lo
 * envía en crudo a la cola de impresión de Windows.
 *
 * A diferencia de window.print(), aquí sí se controla el avance del papel
 * (ESC d n) y el ancho real del cabezal, sin depender del driver ni del
 * navegador.
 */
class TicketEscPosService
{
    private const ESC = "\x1B";   // Comandos ESC/POS

    private const GS = "\x1D";    // Comandos GS/POS

    // La impresora rechaza caracteres no ASCII: se sustituyen por su equivalente.
    private const REEMPLAZOS = [
        'á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'ã' => 'a', 'å' => 'a',
        'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e',
        'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o', 'õ' => 'o',
        'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u',
        'ñ' => 'n', 'ç' => 'c', 'ý' => 'y',
        'Á' => 'A', 'À' => 'A', 'Ä' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Å' => 'A',
        'É' => 'E', 'È' => 'E', 'Ë' => 'E', 'Ê' => 'E',
        'Í' => 'I', 'Ì' => 'I', 'Ï' => 'I', 'Î' => 'I',
        'Ó' => 'O', 'Ò' => 'O', 'Ö' => 'O', 'Ô' => 'O', 'Õ' => 'O',
        'Ú' => 'U', 'Ù' => 'U', 'Ü' => 'U', 'Û' => 'U',
        'Ñ' => 'N', 'Ç' => 'C', 'Ý' => 'Y',
        '¡' => '!', '¿' => '?', '·' => '-', '•' => '-',
        'º' => 'o', 'ª' => 'a',
        '—' => '-', '–' => '-', '“' => '"', '”' => '"', '’' => "'", '´' => '',
    ];

    private string $buffer = '';

    private int $ancho = 32;

    /*  ╔════════ API pública ════════╗
        ╚═════════════════════════════╝ */

    public function imprimir(array $data, ?array $empresa = null, ?string $impresora = null): bool
    {
        return $this->enviar($this->generar($data, $empresa), $impresora);
    }

    public function generar(array $data, ?array $empresa = null): string
    {
        $this->ancho = (int) config('impresora.columnas', 42);
        $this->buffer = self::ESC."\x40"; // ESC @ reinicia la impresora

        // Fuente B = letra más pequeña (42 columnas en 58 mm).
        if (strtoupper((string) config('impresora.fuente', 'B')) === 'B') {
            $this->buffer .= self::ESC."\x4D\x01";
            $this->buffer .= self::GS."\x21\x00";
        }

        $this->generarEncabezado($empresa ?? []);
        $this->generarDatosVenta($data);
        $this->generarDetalle($data);
        $this->generarResumen($data);
        $this->generarPie();

        return $this->buffer;
    }

    /*  ╔════════ Envío al spooler ════════╗
        ╚═══════════════════════════════════╝ */

    public function enviar(string $bytes, ?string $impresora = null): bool
    {
        $impresora = $impresora ?: (string) config('impresora.nombre');
        $script = (string) config('impresora.script_raw');

        if (! is_file($script)) {
            throw new \RuntimeException('No se encontró el script de impresión RAW: '.$script);
        }

        $archivo = tempnam(sys_get_temp_dir(), 'ticket_escpos_');

        if ($archivo === false) {
            throw new \RuntimeException('No se pudo crear el archivo temporal del ticket.');
        }

        file_put_contents($archivo, $bytes);

        $comando = sprintf(
            'powershell -NoProfile -ExecutionPolicy Bypass -File %s -Printer %s -Path %s 2>&1',
            escapeshellarg($script),
            escapeshellarg($impresora),
            escapeshellarg($archivo)
        );

        $salida = [];
        $codigo = 0;
        exec($comando, $salida, $codigo);

        @unlink($archivo);

        return $codigo === 0 && trim(implode(' ', $salida)) === 'OK';
    }

    /*  ╔════════ Secciones del ticket ════════╗
        ╚═══════════════════════════════════════╝ */

    private function generarEncabezado(array $empresa): void
    {
        $this->rasterLogo();

        $this->centrar($this->recortar($empresa['nombre_empresa'] ?? 'MI NEGOCIO'));

        if (! empty($empresa['ruc_empresa'])) {
            $this->centrar('RUC: '.$empresa['ruc_empresa']);
        }

        if (! empty($empresa['direccion_empresa'])) {
            $this->parrafoCentrado('Direccion: '.$empresa['direccion_empresa']);
        }

        if (! empty($empresa['telefono_empresa'])) {
            $this->parrafoCentrado('Teléfono: '.$empresa['telefono_empresa']);
        }

        $this->separador();
    }

    private function generarDatosVenta(array $data): void
    {
        $fecha = $this->fechaObjeto($data);

        $this->parrafo('Fecha: '.$fecha->format('d/m/y g:i A'));
        $this->parrafo('Factura: '.$this->numeroFactura($data));
        $this->parrafo('Cliente: '.$this->cliente($data));

        if ($usuario = $this->usuario($data)) {
            $this->parrafo('Facturo: '.$usuario);
        }

        if ($metodoPago = $this->metodoPago($data)) {
            $this->parrafo('Pago: '.$metodoPago);
        }

        $this->separador();
    }

    private function generarDetalle(array $data): void
    {
        $anchoImporte = 9;
        $anchoDescripcion = $this->ancho - 3 - 1 - 1 - $anchoImporte;

        $this->linea($this->pad('Nº', 3).' '
            .$this->padCentrado('INFO', $anchoDescripcion).' '
            .$this->padIzquierda('TOTAL', $anchoImporte));
        $this->separador();

        foreach ($this->productos($data) as $producto) {
            $cantidad = $this->numero($producto['cantidad']);
            $importe = $this->monto($producto['total']);

            if (mb_strlen($importe, 'UTF-8') > $anchoImporte) {
                $importe = mb_substr($importe, 0, $anchoImporte, 'UTF-8');
            }

            $descripcion = $this->envolver($producto['nombre'], $anchoDescripcion);
            $primera = array_shift($descripcion) ?? '';

            $this->linea($this->pad($cantidad, 3).' '
                .$this->padCentrado($primera, $anchoDescripcion).' '
                .$this->padIzquierda($importe, $anchoImporte));

            foreach ($descripcion as $resto) {
                $this->linea('    '.$this->padCentrado($resto, $anchoDescripcion));
            }

            $this->linea('    '.$this->padCentrado('a '.$this->monto($producto['precio']).' c/u', $anchoDescripcion));
        }

        $this->separador();
    }

    private function generarResumen(array $data): void
    {
        $subtotal = (float) ($data['subtotal_venta'] ?? 0);
        $impuesto = (float) ($data['impuesto_venta'] ?? 0);
        $descuento = (float) ($data['descuento_venta'] ?? 0);
        $total = (float) ($data['total_venta'] ?? $data['total'] ?? $subtotal + $impuesto);
        $this->dosColumnas('Subtotal', 'C$ '.$this->monto($subtotal));

        if ($descuento > 0) {
            $this->dosColumnas('Descuento', '-C$ '.$this->monto($descuento));
        }

        if ($impuesto > 0) {
            $this->dosColumnas('Impuesto', 'C$ '.$this->monto($impuesto));
        }

        $this->separador();

        $this->negrita(true);
        $this->dosColumnas('TOTAL', 'C$ '.$this->monto($total));
        $this->negrita(false);

        $this->separador();

        if (! empty($data['pago_plazos'])) {
            $this->dosColumnas('Abono', 'C$ '.$this->monto($data['monto_recibido'] ?? 0));
            $this->dosColumnas('Saldo', 'C$ '.$this->monto($data['saldo_pendiente'] ?? 0));
        } else {
            if (isset($data['monto_recibido'])) {
                $this->dosColumnas('Recibido', 'C$ '.$this->monto($data['monto_recibido']));
            }

            if (isset($data['vuelto'])) {
                $this->dosColumnas('Vuelto', 'C$ '.$this->monto($data['vuelto']));
            }
        }

        $this->separador();
    }

    private function generarPie(): void
    {
        $this->centrar('¡Gracias por su compra!');
        $this->parrafoCentrado('Para nosotros, tu experiencia es lo mas importante');

        // Avance mínimo para que la barra de desgarre no corte la última línea.
        $lineas = max(0, (int) config('impresora.lineas_avance', 2));

        if ($lineas > 0) {
            $this->buffer .= self::ESC."\x64".chr($lineas);
        }
    }

    /*  ╔════════ Normalización de datos ════════╗
        ╚═════════════════════════════════════════╝ */

    private function productos(array $data): array
    {
        $origen = $data['productos'] ?? $data['detalles'] ?? $data['detalle'] ?? [];

        return array_map(function (array $item) {
            $nombre = $item['nombre']
                ?? $item['nombre_producto']
                ?? ($item['producto']['nombre_producto'] ?? 'Producto');

            if (! empty($item['descripcion_variacion'])) {
                $nombre .= ' '.$item['descripcion_variacion'];
            }

            $cantidad = (float) ($item['cantidad'] ?? $item['cantidad_venta'] ?? 0);
            $precio = (float) ($item['precio'] ?? $item['precio_unitario_venta'] ?? 0);
            $subtotal = (float) ($item['subtotal'] ?? $item['subtotal_detalle_venta'] ?? $precio * $cantidad);
            $impuesto = (float) ($item['impuesto'] ?? $item['monto_impuesto'] ?? 0);
            $total = (float) ($item['total'] ?? $subtotal + $impuesto);

            return [
                'nombre' => preg_replace('/\s*[·|,-]?\s*SKU\s*:.*/i', '', $nombre) ?: 'Producto',
                'cantidad' => $cantidad,
                'precio' => $precio,
                'total' => $total,
            ];
        }, $origen);
    }

    private function fechaObjeto(array $data): Carbon
    {
        $origen = $data['fecha_venta'] ?? $data['fecha'] ?? $data['created_at'] ?? null;

        try {
            return $origen ? Carbon::parse($origen) : Carbon::now();
        } catch (\Throwable) {
            return Carbon::now();
        }
    }

    private function numeroFactura(array $data): string
    {
        return (string) ($data['numero_factura'] ?? $data['factura'] ?? 'FACTURA');
    }

    private function cliente(array $data): string
    {
        $cliente = $data['cliente'] ?? null;

        if (is_array($cliente)) {
            return (string) ($cliente['nombre_cliente'] ?? 'Consumidor final');
        }

        return $cliente ? (string) $cliente : 'Consumidor final';
    }

    private function usuario(array $data): ?string
    {
        $usuario = $data['usuario'] ?? null;

        if (is_array($usuario)) {
            return $usuario['nombre_usuario'] ?? null;
        }

        return $usuario ? (string) $usuario : null;
    }

    private function metodoPago(array $data): ?string
    {
        $metodo = $data['metodo_pago'] ?? $data['metodoPago'] ?? null;

        if (is_array($metodo)) {
            return $metodo['nombre_metodo_pago'] ?? null;
        }

        return $metodo ? (string) $metodo : null;
    }

    /*  ╔════════ Comandos y formato ════════╗
        ╚═════════════════════════════════════╝ */

    private function linea(string $texto = ''): void
    {
        $this->buffer .= $this->texto($texto)."\n";
    }

    private function texto(string $texto): string
    {
        // La impresora falla con caracteres fuera de ASCII: se quitan los acentos
        // y cualquier símbolo no imprimible antes de enviar los bytes.
        $texto = strtr($texto, self::REEMPLAZOS);

        return preg_replace('/[^\x20-\x7E\n]/', '', $texto) ?? $texto;
    }

    private function centrar(string $texto): void
    {
        $this->negrita(true);
        $this->buffer .= self::ESC."\x61\x01".$this->texto($texto)."\n";
        $this->buffer .= self::ESC."\x61\x00";
        $this->negrita(false);
    }

    private function parrafoCentrado(string $texto): void
    {
        foreach ($this->envolver($texto, $this->ancho) as $linea) {
            $this->buffer .= self::ESC."\x61\x01".$this->texto($linea)."\n";
        }

        $this->buffer .= self::ESC."\x61\x00";
    }

    private function parrafo(string $texto): void
    {
        foreach ($this->envolver($texto, $this->ancho) as $linea) {
            $this->linea($linea);
        }
    }

    private function dosColumnas(string $izquierda, string $derecha, ?int $columnas = null): void
    {
        $columnas = $columnas ?? $this->ancho;
        $izquierda = $this->recortar($izquierda, $columnas - mb_strlen($derecha, 'UTF-8') - 1);
        $espacios = max(1, $columnas - mb_strlen($izquierda, 'UTF-8') - mb_strlen($derecha, 'UTF-8'));

        $this->linea($izquierda.str_repeat(' ', $espacios).$derecha);
    }

    private function negrita(bool $activa): void
    {
        $this->buffer .= self::ESC."\x45".($activa ? "\x01" : "\x00");
    }

    private function separador(): void
    {
        $this->linea(str_repeat('-', $this->ancho));
    }

    private function padCentrado(string $texto, int $ancho): string
    {
        $texto = $this->recortar($texto, $ancho);
        $largo = mb_strlen($texto, 'UTF-8');
        $izquierda = (int) floor(($ancho - $largo) / 2);

        return str_repeat(' ', max(0, $izquierda)).$texto
            .str_repeat(' ', max(0, $ancho - $largo - $izquierda));
    }

    private function envolver(string $texto, int $ancho): array
    {
        $palabras = preg_split('/\s+/u', trim($texto)) ?: [];
        $lineas = [];
        $actual = '';

        foreach ($palabras as $palabra) {
            $candidato = $actual === '' ? $palabra : $actual.' '.$palabra;

            if (mb_strlen($candidato, 'UTF-8') <= $ancho) {
                $actual = $candidato;

                continue;
            }

            if ($actual !== '') {
                $lineas[] = $actual;
            }

            $actual = mb_substr($palabra, 0, $ancho, 'UTF-8');
        }

        if ($actual !== '') {
            $lineas[] = $actual;
        }

        return $lineas ?: [''];
    }

    private function recortar(string $texto, ?int $ancho = null): string
    {
        $ancho = $ancho ?? $this->ancho;

        return mb_strlen($texto, 'UTF-8') > $ancho
            ? mb_substr($texto, 0, $ancho - 1, 'UTF-8').'.'
            : $texto;
    }

    private function pad(string $texto, int $ancho): string
    {
        $texto = $this->recortar($texto, $ancho);

        return $texto.str_repeat(' ', max(0, $ancho - mb_strlen($texto, 'UTF-8')));
    }

    private function padIzquierda(string $texto, int $ancho): string
    {
        return str_repeat(' ', max(0, $ancho - mb_strlen($texto, 'UTF-8'))).$texto;
    }

    private function numero(float $valor): string
    {
        return floor($valor) === $valor ? (string) (int) $valor : number_format($valor, 2, '.', '');
    }

    private function monto(float $valor): string
    {
        $valor = round($valor, 2);

        return floor($valor) === $valor ? (string) (int) $valor : number_format($valor, 2, '.', '');
    }

    /*  ╔════════ Logo (raster GS v 0) ════════╗
        ╚════════════════════════════════════════╝ */

    private function rasterLogo(): void
    {
        $ruta = resource_path('img/minilogo.PNG');

        if (! is_file($ruta) || ! function_exists('imagecreatefrompng')) {
            return;
        }

        $origen = @imagecreatefrompng($ruta);

        if (! $origen) {
            return;
        }

        $anchoDestino = 128; // 16 mm a 203 dpi
        $alto = max(1, (int) round(imagesy($origen) * $anchoDestino / imagesx($origen)));
        $lienzo = imagecreatetruecolor($anchoDestino, $alto);
        imagefill($lienzo, 0, 0, imagecolorallocate($lienzo, 255, 255, 255));
        imagecopyresampled($lienzo, $origen, 0, 0, 0, 0, $anchoDestino, $alto, imagesx($origen), imagesy($origen));

        $bytesPorLinea = (int) ceil($anchoDestino / 8);
        $datos = '';

        for ($y = 0; $y < $alto; $y++) {
            for ($x = 0; $x < $bytesPorLinea; $x++) {
                $byte = 0;

                for ($bit = 0; $bit < 8; $bit++) {
                    $px = ($x * 8) + $bit;

                    if ($px >= $anchoDestino) {
                        break;
                    }

                    $rgb = imagecolorat($lienzo, $px, $y);
                    $luz = ((($rgb >> 16) & 0xFF) * 0.299) + ((($rgb >> 8) & 0xFF) * 0.587) + (($rgb & 0xFF) * 0.114);

                    if ($luz < 128) {
                        $byte |= 0x80 >> $bit;
                    }
                }

                $datos .= chr($byte);
            }
        }

        imagedestroy($origen);
        imagedestroy($lienzo);

        $this->buffer .= self::ESC."\x61\x01";
        $this->buffer .= self::GS."\x76\x30\x00"
            .chr($bytesPorLinea % 256).chr(intdiv($bytesPorLinea, 256))
            .chr($alto % 256).chr(intdiv($alto, 256))
            .$datos;
        $this->buffer .= self::ESC."\x61\x00";
    }
}
