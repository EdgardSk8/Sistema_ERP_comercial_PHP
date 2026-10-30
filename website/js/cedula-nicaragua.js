/* ╔══════════════════════════════════════════════════════════════╗
   ║  Tienda · Formato de cédula nicaragüense                     ║
   ║  Misma lógica de la función global del ERP.                  ║
   ╚══════════════════════════════════════════════════════════════╝ */

window.formatearCedula = function (inputId) {
    const cedula = document.getElementById(inputId);
    if (!cedula) return;

    cedula.addEventListener('input', function () {
        let valor = this.value.replace(/[^0-9a-zA-Z]/g, '');

        const numeros = valor.slice(0, 13).replace(/[^0-9]/g, '');
        const letra = valor.slice(13, 14).replace(/[^a-zA-Z]/g, '').toUpperCase();

        valor = numeros + letra;

        if (valor.length > 3) valor = valor.slice(0, 3) + '-' + valor.slice(3);
        if (valor.length > 10) valor = valor.slice(0, 10) + '-' + valor.slice(10);

        this.value = valor;
    });
};
