import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
    apiKey: "AIzaSyBluBcGW1ThHpRmyM8p_wiT3GVGCRF2HUQ",
    authDomain: "tv-digital-1678f.firebaseapp.com",
    projectId: "tv-digital-1678f",
    storageBucket: "tv-digital-1678f.firebasestorage.app",
    messagingSenderId: "979622074163",
    appId: "1:979622074163:web:bbd51e8757616ced4b9046"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ELEMENTOS */
const cardsContainer = document.getElementById("cardsClientes");
const filtroPlataforma = document.getElementById("filtroPlataforma");

const nombreInput = document.getElementById("nombre");
const usuarioInput = document.getElementById("usuario");
const vencimientoInput = document.getElementById("vencimiento");
const plataformaInput = document.getElementById("plataforma");

const countActivos = document.getElementById("countActivos");
const countPronto = document.getElementById("countPronto");
const countVencidos = document.getElementById("countVencidos");

/* MODAL */
const modal = document.getElementById("modalEditar");
const editNombre = document.getElementById("editNombre");
const editUsuario = document.getElementById("editUsuario");
const editVencimiento = document.getElementById("editVencimiento");
const editPlataforma = document.getElementById("editPlataforma");

let clienteEditandoId = null;

/* FECHAS */
function diasParaVencer(fecha) {
    const hoy = new Date();
    const v = new Date(fecha);
    hoy.setHours(0,0,0,0);
    v.setHours(0,0,0,0);
    return Math.ceil((v - hoy) / (1000 * 60 * 60 * 24));
}

function sumarDias(fecha, dias) {
    const f = new Date(fecha);
    f.setDate(f.getDate() + dias);
    return f.toISOString().split("T")[0];
}

/* GUARDAR */
window.guardarCliente = async () => {
    await addDoc(collection(db, "clientes"), {
        nombre: nombreInput.value,
        usuario: usuarioInput.value,
        vencimiento: vencimientoInput.value,
        plataforma: plataformaInput.value
    });

    nombreInput.value = "";
    usuarioInput.value = "";
    vencimientoInput.value = "";
    plataformaInput.value = "";

    cargarClientes();
};

/* LISTAR */
window.cargarClientes = async () => {
    cardsContainer.innerHTML = "";

    let activos = 0, pronto = 0, vencidos = 0;

    const q = query(collection(db, "clientes"), orderBy("vencimiento", "asc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(d => {
        const c = d.data();
        if (filtroPlataforma.value && c.plataforma !== filtroPlataforma.value) return;

        const dias = diasParaVencer(c.vencimiento);

        let estado = "activo", texto = "Activo";
        if (dias < 0) {
            estado = "vencido"; texto = "Vencido"; vencidos++;
        } else if (dias <= 3) {
            estado = "pronto"; texto = "Por vencer"; pronto++;
        } else {
            activos++;
        }

        cardsContainer.innerHTML += `
            <div class="cliente-card">
                <span class="estado ${estado}">${texto}</span>
                <h3>${c.nombre}</h3>
                <div class="usuario">@${c.usuario}</div>
                <div class="info">
                    📅 ${c.vencimiento}<br>
                    📺 ${c.plataforma}
                </div>
                <div class="card-actions">
                    <button onclick="editarCliente('${d.id}','${c.nombre}','${c.usuario}','${c.vencimiento}','${c.plataforma}')">✏️</button>
                    <button class="btn-wsp" onclick="enviarWhatsApp('${c.nombre}','${c.vencimiento}')">💬</button>
                </div>
            </div>
        `;
    });

    countActivos.textContent = activos;
    countPronto.textContent = pronto;
    countVencidos.textContent = vencidos;
    mostrarAlertasSistema(vencidos, pronto);

};

/* EDITAR */
window.editarCliente = (id, n, u, v, p) => {
    clienteEditandoId = id;
    editNombre.value = n;
    editUsuario.value = u;
    editVencimiento.value = v;
    editPlataforma.value = p;
    modal.style.display = "flex";
};

window.guardarEdicion = async () => {
    await updateDoc(doc(db, "clientes", clienteEditandoId), {
        nombre: editNombre.value,
        usuario: editUsuario.value,
        vencimiento: editVencimiento.value,
        plataforma: editPlataforma.value
    });
    cerrarModal();
    cargarClientes();
};

window.sumar30Dias = () => {
    editVencimiento.value = sumarDias(editVencimiento.value, 30);
};

window.eliminarCliente = async () => {
    if (!confirm("¿Eliminar cliente?")) return;
    await deleteDoc(doc(db, "clientes", clienteEditandoId));
    cerrarModal();
    cargarClientes();
};

window.cerrarModal = () => {
    modal.style.display = "none";
};

window.enviarWhatsApp = (nombre, vencimiento) => {
    const msg = `Hola ${nombre} 👋 Tu TV Digital vence el ${vencimiento}. Avisame para renovar 📺`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
};

/* INIT */
cargarClientes();
function mostrarAlertasSistema(vencidos, pronto) {
    if (vencidos > 0) {
        alert(`🔴 Atención: Tenés ${vencidos} clientes VENCIDOS`);
    } else if (pronto > 0) {
        alert(`🟡 Aviso: Tenés ${pronto} clientes por vencer en los próximos días`);
    }
}
