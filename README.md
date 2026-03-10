# 📜 Archivística · Test Diario
### App de entrenamiento para las oposiciones de Archivística

---

## 🚀 Cómo arrancar el proyecto

```bash
# 1. Entra en la carpeta
cd archivistica-test

# 2. Instala dependencias
npm install

# 3. Arranca el servidor de desarrollo
npm run dev

# Abre http://localhost:5173
```

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx          ← Cabecera sticky, navegación
│   │   └── Header.css
│   ├── Home/
│   │   ├── Home.jsx            ← Pantalla de inicio con bloques de modo
│   │   └── Home.css
│   ├── TestRunner/
│   │   ├── TestRunner.jsx      ← Motor del test (intro + running + fin)
│   │   └── TestRunner.css
│   ├── Question/
│   │   ├── QuestionCard.jsx    ← Tarjeta de pregunta + opciones + explicación
│   │   └── QuestionCard.css
│   ├── Results/
│   │   ├── Results.jsx         ← Pantalla de resultados con revisión
│   │   └── Results.css
│   ├── Progress/
│   │   ├── ProgressBar.jsx     ← Barra de progreso reutilizable
│   │   └── ProgressBar.css
│   └── ui/
│       ├── Badge.jsx / .css    ← Etiquetas de categoría/dificultad
│       └── Button.jsx / .css   ← Botón reutilizable (varios estilos)
│
├── data/
│   └── questions.js            ← 130+ preguntas + configuración de modos
│
├── hooks/
│   └── useTest.js              ← Lógica del test (estado, timer, respuestas)
│
├── styles/
│   └── globals.css             ← Variables CSS, reset, animaciones globales
│
├── App.jsx                     ← Enrutado principal (home ↔ test)
├── App.css
└── main.jsx                    ← Entry point React
```

---

## 🎯 Modos de test

| Modo              | Preguntas | Tiempo | Tipo            |
|-------------------|-----------|--------|-----------------|
| Test Principiante | 20        | 25 min | Solo básicas    |
| Test Avanzado     | 50        | 60 min | Completo        |
| Simulacro Examen  | 100       | 120 min| Completo        |
| Supuesto Práctico I  | 15     | 30 min | Casos prácticos |
| Supuesto Práctico II | 15     | 30 min | Casos prácticos |

---

## 📚 Bloques temáticos cubiertos

- Fundamentos Archivísticos (principios, ciclo vital, valoración)
- Tipos de Archivos (de oficina, intermedio, histórico, AHN, AGA, Simancas...)
- Descripción Archivística (ISAD(G), ISAAR, ISDF, ISDIAH, RiC, PARES...)
- Gestión Documental (ISO 15489, MoReq, calendarios de conservación...)
- Legislación Archivística (Ley 16/1985, Ley 19/2013, Ley 39/2015, RGPD...)
- Conservación y Restauración (temperatura, humedad, liofilización, desacidificación...)
- Digitalización y Documento Electrónico (PDF/A, metadatos, ENI, ENS, OCR...)
- Constitución y Administración Pública
- Historia de los Archivos (Simancas, Indias, AHN, Corona de Aragón...)
- Normas y Sistemas (ICA, CNEDA, Censo-Guía, RiC...)

---

## ➕ Cómo añadir preguntas

Edita el array `ALL_QUESTIONS` en `src/data/questions.js`:

```js
{
  id: 131,               // ID único incremental
  block: 'fundamentos',  // clave del bloque (ver BLOCKS)
  difficulty: 'basic',   // 'basic' | 'advanced' | 'practical'
  question: '¿...?',
  options: ['A', 'B', 'C', 'D'],
  answer: 0,             // índice de la opción correcta (0-3)
  explanation: 'La respuesta correcta es...',
},
```

---

## 🎨 Tecnologías

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (utilidades)
- **CSS Modules** por componente (variables CSS propias)
- **Google Fonts**: Playfair Display · Lato · JetBrains Mono
- Sin dependencias de UI externas
"# archivistica-test" 
