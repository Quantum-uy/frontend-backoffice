const API_USUARIOS    = '/sigeru/api-usuarios';
const API_CAMIONES    = '/sigeru/api-camiones';
const API_GESTION     = '/sigeru/api-gestion';
const API_RECOLECCION = '/sigeru/api-recoleccion';

const PERMISOS = {
    administrador: ['dashboard', 'usuarios', 'camiones', 'contenedores', 'rutas', 'incidencias', 'centros-acopio', 'maquinaria', 'mantenimiento', 'mapa', 'informes'],
    operario:      ['dashboard', 'camiones', 'contenedores', 'incidencias', 'centros-acopio', 'maquinaria', 'mantenimiento', 'mapa', 'informes'],
    conductor:     ['dashboard', 'rutas', 'incidencias', 'mapa'],
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
    fetch(API_USUARIOS + '/logout', { method: 'POST' });
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
        a.style.display = permitidos.includes(a.dataset.page) ? '' : 'none';
    });

    let roleEl = document.getElementById('user-role');
    if (!roleEl) {
        const header = document.querySelector('.page-header');
        if (header) {
            roleEl = document.createElement('div');
            roleEl.className = 'user-role';
            roleEl.id = 'user-role';
            header.appendChild(roleEl);
        }
    }
    if (roleEl) roleEl.textContent = usuario.rol || 'Funcionario';

    const paginaActual = document.querySelector('.sidebar nav a.active');
    if (paginaActual && !permitidos.includes(paginaActual.dataset.page)) {
        window.location.href = 'index.html';
    }
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

// --- Sistema de notificaciones ---
async function cargarNotificaciones() {
    try {
        const data = await fetch(API_GESTION + '/incidencias').then(r => r.json()).catch(() => []);
        const usr = JSON.parse(sessionStorage.getItem('usuario'));
        const abiertas = data.filter(i => i.estado === 'abierta').length;
        const enProceso = data.filter(i => i.estado === 'en_proceso').length;
        const pendientes = abiertas + enProceso;

        const linkInc = document.querySelector('.sidebar nav a[data-page="incidencias"]');
        if (linkInc && pendientes > 0) {
            const badge = document.createElement('span');
            badge.className = 'notif-badge';
            badge.textContent = pendientes > 99 ? '99+' : pendientes;
            linkInc.style.position = 'relative';
            linkInc.appendChild(badge);
        }

        if (!sessionStorage.getItem('notif_mostrada')) {
            sessionStorage.setItem('notif_mostrada', '1');

            if (usr && (usr.rol === 'conductor' || usr.rol === 'peon')) {
                const misAsignadas = data.filter(i => i.id_conductor_asignado == usr.id_usuario && i.estado !== 'resuelta');
                if (misAsignadas.length > 0) {
                    mostrarToast(`Tenés ${misAsignadas.length} incidencia${misAsignadas.length > 1 ? 's' : ''} asignada${misAsignadas.length > 1 ? 's' : ''} pendiente${misAsignadas.length > 1 ? 's' : ''}.`, 'warning');
                }
            } else if (abiertas > 0) {
                mostrarToast(`Hay ${abiertas} incidencia${abiertas > 1 ? 's' : ''} abierta${abiertas > 1 ? 's' : ''} pendientes de atención.`, 'warning');
            }
        }
    } catch (e) { /* silencioso */ }
}

function mostrarToast(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (tipo || 'info');
    toast.innerHTML = `<span>${mensaje}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:1.2rem;cursor:pointer;margin-left:1rem">&times;</button>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast-visible'); }, 10);
    setTimeout(() => { toast.classList.remove('toast-visible'); setTimeout(() => toast.remove(), 300); }, 6000);
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarPermisos();
    if (sessionStorage.getItem('usuario')) cargarNotificaciones();
});
