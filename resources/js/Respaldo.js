export default function initRespaldo() {

    $(document).off('.respaldo');
    const titulo = document.getElementById('titulo');
    if (titulo) titulo.textContent = 'RESPALDO Y RESTAURACIÓN DE BASE DE DATOS';
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    $(document).on('click.respaldo', '#btnExportarSistema', async function () {

    // =========================================================
    // EXPORTAR SISTEMA
    // =========================================================

        const btn = this;

        try {

            // =============================
            // OBTENER FORMATO
            // =============================
            let formato = 'sql';

            document.querySelectorAll('input[name="formato"]').forEach(radio => {
                if (radio.checked) formato = radio.value;
            });

            btn.disabled = true;
            btn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Exportando...
            `;

            // =============================
            // PETICIÓN BACKEND
            // =============================
            const respuesta = await fetch('/backup/exportar', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    formato: formato,
                    tipo: 'datos'
                })
            });

            // =============================
            // ERROR HTTP
            // =============================
            if (!respuesta.ok) {

                let mensaje = 'Error al generar exportación';

                try {
                    const error = await respuesta.json();
                    mensaje = error.message || mensaje;
                } catch {
                    const text = await respuesta.text();
                    console.error('Respuesta no JSON:', text);
                }

                throw new Error(mensaje);
            }

            // =============================
            // DESCARGA ARCHIVO
            // =============================
            const blob = await respuesta.blob();
            const url = window.URL.createObjectURL(blob);

            let filename = `backup.${formato}`;

            const disposition = respuesta.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/);

            if (match) filename = match[1];

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);

            // console.log('✅ Exportación completada:', filename);
            // console.log('✅ Exportación completada:', url);
            // console.log('✅ Exportación completada:', blob);
            // console.log('✅ Exportación completada:', formato);
            mostrarToast("Exportacion de base de datos exitosa en formato " + formato + " ", "success");

        } catch (error) {

            console.error('🔥 Error exportación:', error);
            alert(error.message || 'Error inesperado');

        } finally {

            btn.disabled = false;
            btn.innerHTML = `
                <i class="bi bi-download me-1"></i>
                Exportar Todo
            `;
        }
    });


    // =========================================================
    // IMPORTAR SISTEMA SQL
    // =========================================================
    $(document).on('click.respaldo', '#btnImportarSistema', async function () {

        const input = document.getElementById('archivoSql');
        const btn = this;

        if (!input.files || !input.files.length) {
            alert('Selecciona un archivo SQL');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', input.files[0]);

        try {

            btn.disabled = true;
            btn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Importando...
            `;

            const res = await fetch('/backup/importar', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                body: formData
            });

            // =============================
            // VALIDAR JSON SEGURO
            // =============================
            let data;

            try {
                data = await res.json();
            } catch {
                const text = await res.text();
                throw new Error('Respuesta inválida del servidor');
            }

            if (!res.ok) {
                throw new Error(data.message || 'Error importando base de datos');
            }

            mostrarToast("Base de datos restaurada correctamente", "success");

            // limpiar input
            input.value = '';

        } catch (error) {

            console.error('🔥 Error importación:', error);
            alert(error.message || 'Error inesperado');

        } finally {

            btn.disabled = false;
            btn.innerHTML = `
                <i class="bi bi-upload"></i>
                Importar
            `;
        }
    });

};
