// Definición de los contenedores con sus dimensiones y pesos máximos
const contenedores = {
    'HC40': { largo: 1200, ancho: 235, alto: 252, peso_max: 26400 },
    '20ft': { largo: 589, ancho: 235, alto: 233, peso_max: 21700 }
};

// Clase para la simulación de cálculo
class SimulacionCalculo {
    calcular_estibado(params) {
        try {
            const cont = contenedores[params.contenedor];
            const refs = params.referencias;
            const granel = parseFloat(params.granel);
            const estibado = parseFloat(params.estibado);
            const granel_nuevo = parseFloat(params.granel_nuevo);
            const estibado_nuevo = parseFloat(params.estibado_nuevo);
            
            // Extraer arrays de las referencias
            const largo = refs.map(r => r.largo);
            const ancho = refs.map(r => r.ancho);
            const alto = refs.map(r => r.alto);
            const peso = refs.map(r => r.peso);
            const cantidad_deseada = refs.map(r => r.cantidad);
            
            // Calcular unidades por capa y por estiba
            const unidades_capa = [];
            const unidades_altura = [];
            const unidades_estiba = [];
            
            for (let i = 0; i < refs.length; i++) {
                const capa1 = Math.floor(120 / largo[i]) * Math.floor(100 / ancho[i]);
                const capa2 = Math.floor(120 / ancho[i]) * Math.floor(100 / largo[i]);
                unidades_capa.push(Math.max(capa1, capa2));
                unidades_altura.push(Math.floor(cont.alto / alto[i]));
                unidades_estiba.push(unidades_capa[i] * unidades_altura[i]);
            }
            
            // Calcular total deseado y proporciones
            const total_deseado = cantidad_deseada.reduce((a, b) => a + b, 0);
            const proporcion = cantidad_deseada.map(cant => cant / total_deseado);
            
            // Calcular límites
            const volumen_ref = largo.map((l, i) => l * ancho[i] * alto[i]);
            const volumen_total_deseado = volumen_ref.reduce((acc, vol, i) => acc + vol * cantidad_deseada[i], 0);
            const peso_total_deseado = peso.reduce((acc, p, i) => acc + p * cantidad_deseada[i], 0);
            
            const volumen_contenedor = cont.largo * cont.ancho * cont.alto;
            const limite_volumen = volumen_contenedor / (volumen_total_deseado / total_deseado);
            const limite_peso = cont.peso_max / (peso_total_deseado / total_deseado);
            
            const estibas_largo = Math.floor(cont.largo / 120);
            const estibas_ancho = Math.floor(cont.ancho / 100);
            const total_estibas = estibas_largo * estibas_ancho;
            
            const suma_estibas = cantidad_deseada.reduce((acc, cant, i) => {
                return acc + cant / (unidades_estiba[i] * total_deseado);
            }, 0);
            
            const limite_estibas = total_estibas / suma_estibas;
            
            // Calcular factor limitante
            let factor_limitante = Math.min(limite_volumen, limite_peso, limite_estibas, total_deseado);
            
            // Aplicar factores de entrada
            const factor_ajuste = (1 + granel/100 + estibado/100 + granel_nuevo/100 + estibado_nuevo/100)/4;
            factor_limitante *= factor_ajuste;
            
            // Calcular cantidad final
            const cantidad_final = cantidad_deseada.map((cant, i) => {
                const prop = proporcion[i] * factor_limitante;
                return Math.min(
                    Math.floor(prop),
                    unidades_estiba[i] * Math.floor(prop / unidades_estiba[i])
                );
            });
            
            // Calcular estibas usadas
            const estibas_usadas = cantidad_final.map((cant, i) => Math.ceil(cant / unidades_estiba[i]));
            
            // Calcular volúmenes y pesos
            const volumen_ocupado = cantidad_final.map((cant, i) => cant * volumen_ref[i]);
            const peso_ocupado = cantidad_final.map((cant, i) => cant * peso[i]);
            const volumen_total_ocupado = volumen_ocupado.reduce((a, b) => a + b, 0);
            const peso_total_ocupado = peso_ocupado.reduce((a, b) => a + b, 0);
            
            const espacio_restante = volumen_contenedor - volumen_total_ocupado;
            const peso_restante = cont.peso_max - peso_total_ocupado;
            const total_estibas_usadas = estibas_usadas.reduce((a, b) => a + b, 0);
            
            return this.generar_reporte(
                refs, 
                cantidad_deseada, 
                cantidad_final, 
                estibas_usadas, 
                unidades_estiba,
                volumen_ocupado,
                peso_ocupado,
                volumen_total_ocupado,
                peso_total_ocupado,
                total_estibas,
                total_estibas_usadas,
                espacio_restante,
                peso_restante
            );
            
        } catch (e) {
            throw new Error(`Error en cálculo de capacidad: ${e.message}`);
        }
    }
    
    generar_reporte(refs, cantidad_deseada, cantidad_final, estibas, unidades_estiba,
                   volumen_ocupado, peso_ocupado, volumen_total_ocupado, peso_total_ocupado,
                   total_estibas, total_estibas_usadas, espacio_restante, peso_restante) {
        let reporte = "RESULTADO FINAL:\n";
        reporte += "-".repeat(40) + "\n";
        
        refs.forEach((ref, i) => {
            reporte += `Referencia: ${ref.nombre}\n`;
            reporte += `  Cantidad deseada: ${cantidad_deseada[i]}\n`;
            reporte += `  Cantidad final: ${cantidad_final[i]}\n`;
            reporte += `  Unidades por estiba: ${unidades_estiba[i]}\n`;
            reporte += `  Estibas usadas: ${estibas[i]}\n`;
            reporte += `  Volumen ocupado: ${volumen_ocupado[i].toLocaleString('es').replace(/,/g, '.')} cm³\n`;
            reporte += `  Peso ocupado: ${peso_ocupado[i].toLocaleString('es', {maximumFractionDigits:1})} kg\n`;
            reporte += "-".repeat(40) + "\n";
        });
        
        reporte += "TOTALES:\n\n";
        reporte += `  Volumen total ocupado: ${volumen_total_ocupado.toLocaleString('es').replace(/,/g, '.')} cm³\n`;
        reporte += `  Peso total ocupado: ${peso_total_ocupado.toLocaleString('es', {maximumFractionDigits:1})} kg\n`;
        reporte += `  Estibas totales usadas: ${total_estibas_usadas} de ${total_estibas}\n`;
        reporte += `  Espacio restante: ${espacio_restante.toLocaleString('es').replace(/,/g, '.')} cm³\n`;
        reporte += `  Peso restante: ${peso_restante.toLocaleString('es', {maximumFractionDigits:1})} kg\n`;
        reporte += "-".repeat(40) + "\n";
        
        return reporte;
    }
}

// Variables globales
let referenceCount = 0;

// Función para agregar una nueva fila de referencia
function addReferenceRow() {
    const tbody = document.getElementById('references-body');
    const tr = document.createElement('tr');
    tr.id = `ref-row-${referenceCount}`;
    
    tr.innerHTML = `
        <td><input type="text" class="ref-input" data-field="nombre" placeholder="Ref-${referenceCount + 1}"></td>
        <td><input type="number" class="ref-input" data-field="largo" min="1" value="0"></td>
        <td><input type="number" class="ref-input" data-field="ancho" min="1" value="0"></td>
        <td><input type="number" class="ref-input" data-field="alto" min="1" value="0"></td>
        <td><input type="number" class="ref-input" data-field="peso" min="0" step="0.1" value="0"></td>
        <td><input type="number" class="ref-input" data-field="cantidad" min="0" value="0"></td>
        <td>
            <button class="remove-ref" data-id="${referenceCount}" style="padding: 8px; background: #d9534f;">
                <span class="btn-icon">✕</span> Eliminar
            </button>
        </td>
    `;
    
    tbody.appendChild(tr);
    referenceCount++;
    
    // Agregar evento al botón de eliminar
    tr.querySelector('.remove-ref').addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        document.getElementById(`ref-row-${id}`).remove();
    });
}

// Función para obtener los datos de las referencias
function getReferencesData() {
    const references = [];
    const rows = document.querySelectorAll('#references-body tr');
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('.ref-input');
        const ref = {};
        
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            let value = input.value;
            
            if (field === 'nombre') {
                ref[field] = value || `Ref-${references.length + 1}`;
            } else {
                ref[field] = parseFloat(value) || 0;
            }
        });
        
        // Solo agregar si tiene nombre o cantidad
        if (ref.nombre || ref.cantidad > 0) {
            references.push(ref);
        }
    });
    
    return references;
}

// Función para limpiar todos los campos
function clearFields() {
    // Limpiar parámetros principales
    document.getElementById('granel').value = '0';
    document.getElementById('estibado').value = '0';
    document.getElementById('granel_nuevo').value = '0';
    document.getElementById('estibado_nuevo').value = '0';
    
    // Limpiar referencias
    const tbody = document.getElementById('references-body');
    tbody.innerHTML = '';
    referenceCount = 0;
    
    // Limpiar resultados
    document.getElementById('results').textContent = '';
    
    // Agregar una fila inicial
    addReferenceRow();
}

// Función para ejecutar el cálculo
function calculate() {
    try {
        const params = {
            contenedor: document.getElementById('contenedor').value,
            referencias: getReferencesData(),
            granel: document.getElementById('granel').value,
            estibado: document.getElementById('estibado').value,
            granel_nuevo: document.getElementById('granel_nuevo').value,
            estibado_nuevo: document.getElementById('estibado_nuevo').value
        };
        
        if (params.referencias.length === 0) {
            throw new Error("Debe ingresar al menos una referencia válida");
        }
        
        const simulador = new SimulacionCalculo();
        const resultado = simulador.calcular_estibado(params);
        
        document.getElementById('results').textContent = resultado;
        
    } catch (e) {
        alert(`Error en simulación:\n${e.message}`);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Agregar primera fila de referencia
    addReferenceRow();
    
    // Event listeners
    document.getElementById('add-reference').addEventListener('click', addReferenceRow);
    document.getElementById('calculate').addEventListener('click', calculate);
    document.getElementById('clear').addEventListener('click', clearFields);
    document.getElementById('print').addEventListener('click', function() {
        window.print();
    });
});
