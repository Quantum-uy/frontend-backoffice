const API_USUARIOS = 'http://localhost/sigeru/api-usuarios';
const API_CAMIONES = 'http://localhost/sigeru/api-camiones';
const API_GESTION = 'http://localhost/sigeru/api-gestion';

const PERMISOS = {
    administrador: ['dashboard', 'usuarios', 'camiones', 'contenedores', 'rutas', 'incidencias', 'centros-acopio', 'maquinaria'],
    operario:      ['dashboard', 'contenedores', 'incidencias', 'centros-acopio', 'maquinaria'],
    conductor:     ['dashboard', 'rutas', 'incidencias'],
    peon:          ['dashboard', 'rutas', 'incidencias']
};

function getUsuario() {
    const data = sessionStorage.getItem('usuario');
    if (!data) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(data);
}

function cerrarSesion() {
    sessionStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

function setActivePage(page) {
    document.querySelectorAll('.sidebar nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === page);
    });
}

function aplicarPermisos() {
    const data = sessionStorage.getItem('usuario');
    if (!data) return;
    const usuario = JSON.parse(data);
    const permitidos = PERMISOS[usuario.rol] || [];
    document.querySelectorAll('.sidebar nav a[data-page]').forEach(a => {
        if (!permitidos.includes(a.dataset.page)) {
            a.style.display = 'none';
        }
    });
}

function getBadgeClass(estado) {
    const map = {
        'disponible': 'badge-success',
        'funcional': 'badge-success',
        'activo': 'badge-success',
        'en_ruta': 'badge-warning',
        'en_curso': 'badge-warning',
        'mantenimiento': 'badge-warning',
        'danado': 'badge-danger',
        'inactivo': 'badge-danger',
        'fuera_servicio': 'badge-danger',
        'abierta': 'badge-info',
        'resuelta': 'badge-success'
    };
    return map[estado] || 'badge-info';
}

document.addEventListener('DOMContentLoaded', aplicarPermisos);
