{{-- Pestañas de los catálogos del inventario. Se incluye en cada vista. --}}
<nav class="catalogos-tabs" aria-label="Catálogos de inventario">

    @if(in_array('vista_categorias', session('permisos', [])))
        <a href="{{ route('categorias') }}"
           class="catalogos-tabs__link {{ ($activo ?? '') === 'categorias' ? 'catalogos-tabs__link--activo' : '' }}"
           data-turbo-frame="contenido-dinamico">Categorías</a>
    @endif

    @if(in_array('vista_catalogos_producto', session('permisos', [])))
        <a href="{{ route('catalogos_producto') }}"
           class="catalogos-tabs__link {{ ($activo ?? '') === 'marcas' ? 'catalogos-tabs__link--activo' : '' }}"
           data-turbo-frame="contenido-dinamico">Marcas y atributos</a>
    @endif

    @if(in_array('vista_ubicaciones', session('permisos', [])))
        <a href="{{ route('ubicaciones') }}"
           class="catalogos-tabs__link {{ ($activo ?? '') === 'ubicaciones' ? 'catalogos-tabs__link--activo' : '' }}"
           data-turbo-frame="contenido-dinamico">Ubicaciones</a>
    @endif

    @if(in_array('vista_tallas', session('permisos', [])))
        <a href="{{ route('tallas') }}"
           class="catalogos-tabs__link {{ ($activo ?? '') === 'tallas' ? 'catalogos-tabs__link--activo' : '' }}"
           data-turbo-frame="contenido-dinamico">Tallas</a>
    @endif

    @if(in_array('vista_tipos_medidas', session('permisos', [])))
        <a href="{{ route('tipos.medidas') }}"
           class="catalogos-tabs__link {{ ($activo ?? '') === 'tipos-medidas' ? 'catalogos-tabs__link--activo' : '' }}"
           data-turbo-frame="contenido-dinamico">Tipos de medida</a>
    @endif

    @if(in_array('vista_medidas', session('permisos', [])))
        <a href="{{ route('medidas') }}"
           class="catalogos-tabs__link {{ ($activo ?? '') === 'medidas' ? 'catalogos-tabs__link--activo' : '' }}"
           data-turbo-frame="contenido-dinamico">Medidas</a>
    @endif

</nav>
