export default function initPermisos() {

    document.getElementById('titulo').textContent = 'GESTION DE PERMISOS POR ROL';

    const selectRol = document.getElementById('selectRol');
    const buscarPermiso = document.getElementById('buscarPermiso');
    const contenedor = document.getElementById('contenedorPermisos');
    const estadoSinRol = document.getElementById('estadoSinRol');

    let dataGlobal = null;
    let rolSeleccionado = null;

    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const escapar = valor => {
        const elemento = document.createElement('span');
        elemento.textContent = valor ?? '';
        return elemento.innerHTML;
    };
    const normalizar = valor => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    // ═══════════════════════════════════════
    // 1. CARGAR DATOS INICIALES
    // ═══════════════════════════════════════
    async function cargarDatos() {

        const res = await fetch('/roles/permisos');
        dataGlobal = await res.json();

        llenarRoles(dataGlobal.roles);

        // estado inicial
        mostrarEstadoSinRol();
    }

    // ═══════════════════════════════════════
    // 2. LLENAR SELECT ROLES
    // ═══════════════════════════════════════
    function llenarRoles(roles) {
        selectRol.replaceChildren(new Option('', ''));
        roles.forEach(rol => selectRol.add(new Option(rol.nombre_rol, rol.id_rol)));

        const $selectRol = window.jQuery ? window.jQuery(selectRol) : null;
        if ($selectRol && window.jQuery.fn.select2) {
            if ($selectRol.hasClass('select2-hidden-accessible')) $selectRol.select2('destroy');
            $selectRol.select2({
                width: '100%',
                placeholder: 'Seleccione un rol',
                allowClear: true,
                minimumResultsForSearch: 0,
                dropdownParent: window.jQuery(selectRol).closest('.permisos-selector')
            });
        }
    }

    // ═══════════════════════════════════════
    // 3. CAMBIO DE ROL
    // ═══════════════════════════════════════
    const cambioRol = () => {
        rolSeleccionado = parseInt(selectRol.value, 10);
        buscarPermiso.value = '';
        buscarPermiso.disabled = !rolSeleccionado;

        if (!rolSeleccionado) {
            contenedor.innerHTML = '';
            mostrarEstadoSinRol();
            return;
        }

        mostrarPermisos();
        renderPermisos(rolSeleccionado);
    };
    if (window.jQuery) {
        window.jQuery(selectRol).off('change.permisos').on('change.permisos', cambioRol);
        window.jQuery(buscarPermiso).off('input.permisos').on('input.permisos', filtrarPermisos);
    } else {
        selectRol.addEventListener('change', cambioRol);
        buscarPermiso.addEventListener('input', filtrarPermisos);
    }

    // ═══════════════════════════════════════
    // 4. UI STATES (ESTADO VACÍO / CONTENIDO)
    // ═══════════════════════════════════════
    function mostrarEstadoSinRol() {
        estadoSinRol.style.display = 'flex';
        contenedor.style.display = 'none';
        buscarPermiso.disabled = true;
    }

    function mostrarPermisos() {
        estadoSinRol.style.display = 'none';
        contenedor.style.display = 'block';
        buscarPermiso.disabled = false;
    }

    // ═══════════════════════════════════════
    // 5. RENDER PERMISOS AGRUPADOS POR MÓDULO
    // ═══════════════════════════════════════
    function renderPermisos(idRol) {

        const permisos = dataGlobal.permisos;
        const rol = dataGlobal.roles.find(r => r.id_rol == idRol);

        contenedor.innerHTML = '';

        const modulos = {};

        permisos.forEach(p => {
            if (!modulos[p.modulo_permiso]) {
                modulos[p.modulo_permiso] = [];
            }
            modulos[p.modulo_permiso].push(p);
        });

        let index = 0;

        for (const modulo in modulos) {

            const collapseId = `modulo_${index}`;
            let itemsHTML = '';

            modulos[modulo].forEach(permiso => {

                const checked = rol.permisos.some(rp => rp.id_permiso === permiso.id_permiso);

                itemsHTML += `
                <label class="permiso-card" data-search="${escapar(`${permiso.descripcion_permiso || ''} ${permiso.nombre_permiso || ''}`)}">

                    <span class="permiso-label">
                        ${escapar(permiso.descripcion_permiso || permiso.nombre_permiso)}
                    </span>

                    <input type="checkbox"
                        class="permiso-check"
                        data-id="${permiso.id_permiso}"
                        ${checked ? 'checked' : ''}>

                </label>
                `;
            });

            contenedor.innerHTML += `
                <div class="modulo-permisos" data-modulo="${escapar(modulo)}">

                    <div class="modulo-titulo">
                        ${escapar(modulo.replace(/_/g, ' '))}
                    </div>

                    <div class="permisos-grid">
                        ${itemsHTML}
                    </div>

                </div>
            `;

            index++;
        }

        activarEventosCheckbox();
        filtrarPermisos();
    }

    function filtrarPermisos() {
        const consulta = normalizar(buscarPermiso.value);
        let visibles = 0;

        contenedor.querySelectorAll('.modulo-permisos').forEach(modulo => {
            const coincideModulo = consulta && normalizar(modulo.dataset.modulo).includes(consulta);
            let visiblesModulo = 0;

            modulo.querySelectorAll('.permiso-card').forEach(card => {
                const coincide = !consulta || coincideModulo || normalizar(card.dataset.search || card.textContent).includes(consulta);
                card.style.display = coincide ? '' : 'none';
                if (coincide) visiblesModulo++;
            });

            modulo.style.display = visiblesModulo ? '' : 'none';
            visibles += visiblesModulo;
        });

        let sinResultados = contenedor.querySelector('.sin-resultados-permisos');
        if (!sinResultados) {
            sinResultados = document.createElement('p');
            sinResultados.className = 'sin-resultados-permisos';
            sinResultados.textContent = 'No se encontraron permisos.';
            contenedor.appendChild(sinResultados);
        }
        sinResultados.style.display = consulta && visibles === 0 ? 'block' : 'none';
    }

    // ═══════════════════════════════════════
    // 6. CHECKBOX EVENTS
    // ═══════════════════════════════════════
    function activarEventosCheckbox() {

        document.querySelectorAll('.permiso-check').forEach(check => {

            // 🔥 guardar estado inicial
            check.dataset.previous = check.checked ? "1" : "0";

            check.addEventListener('change', async (e) => {

                const checkbox = e.target;
                const idPermiso = checkbox.getAttribute('data-id');
                const asignar = checkbox.checked;

                try {

                    const res = await fetch('/roles/permisos/asignar', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': token
                        },
                        body: JSON.stringify({
                            id_rol: rolSeleccionado,
                            id_permiso: idPermiso,
                            asignar: asignar
                        })
                    });

                    const data = await res.json();

                    // 🔥 SI FALLA → revertir checkbox
                    if (!data.success) {
                        checkbox.checked = checkbox.dataset.previous === "1";
                    } else {
                        // actualizar estado guardado
                        checkbox.dataset.previous = checkbox.checked ? "1" : "0";
                    }

                    mostrarToast(data.mensaje, data.success ? 'success' : 'danger');

                } catch (error) {

                    // 🔥 rollback en error de red
                    checkbox.checked = checkbox.dataset.previous === "1";

                    mostrarToast('Error al actualizar permiso', 'danger');
                }
            });
        });
    }

    // ═══════════════════════════════════════
    // 7. TOAST
    // ═══════════════════════════════════════
    // Se delega al toast global (FuncionesGlobales.js), que crea su propio
    // contenedor. Así no falla si la vista no trae el markup del toast.
    function mostrarToast(mensaje, tipo = 'success') {
        window.mostrarToast(mensaje, tipo);
    }

    // INIT
    cargarDatos();
};
