const token = document.querySelector('meta[name="csrf-token"]');

if (token) {
    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': token.getAttribute('content')
        }
    });
}
$(document).ready(function(){

    $('#formLogin').on('submit', function(e){
        e.preventDefault();

        const datos = $(this).serialize();

        $.ajax({
            url: '/login',
            method: 'POST',
            data: datos,

            success: function(res){

                if(res.success){
                    // FuncionesGlobales.js expone window.mostrarToast (crea el toast si no existe)
                    window.mostrarToast(res.mensaje, 'success');

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                }

            },

            error: function(err){

                if(err.status === 422){
                    let errores = err.responseJSON.errors;
                    let mensaje = Object.values(errores)[0][0];

                    window.mostrarToast(mensaje, 'danger');

                } else {
                    let mensaje = err.responseJSON.mensaje || 'Error en el login';
                    window.mostrarToast(mensaje, 'danger');
                }

            }

        });

    });

});