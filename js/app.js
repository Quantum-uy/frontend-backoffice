const API_USUARIOS = 'http://localhost/sigeru/api-usuarios';
const API_CAMIONES = 'http://localhost/sigeru/api-camiones';
const API_GESTION = 'http://localhost/sigeru/api-gestion';

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
