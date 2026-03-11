// Temario oficial basado en la convocatoria del Cuerpo Facultativo de Archiveros
// Ministerio de Cultura — BOE nº 300, 13 de diciembre de 2024

export const STUDY_BLOCKS = [
  {
    id: 'constitucion',
    label: 'Constitución y Organización del Estado',
    icon: 'Scale',
    color: '#2563EB',
    bg: '#EFF6FF',
    estimatedMinutes: 45,
    topics: [
      {
        id: 'c1',
        title: 'La Constitución Española de 1978',
        summary: 'Características, estructura y proceso de elaboración. Valores superiores y principios constitucionales.',
        content: `La Constitución Española de 1978 es la norma fundamental del ordenamiento jurídico español, aprobada por referéndum el 6 de diciembre de 1978 y ratificada el 29 de diciembre del mismo año.

**Estructura**
La CE se organiza en un Preámbulo, 169 artículos distribuidos en un Título Preliminar y diez Títulos, cuatro Disposiciones Adicionales, nueve Disposiciones Transitorias, una Disposición Derogatoria y una Disposición Final.

**Valores superiores del ordenamiento jurídico** (art. 1.1)
- Libertad
- Justicia
- Igualdad
- Pluralismo político

**Principios constitucionales fundamentales**
El Título Preliminar (arts. 1-9) establece las bases del sistema: España se constituye en un Estado social y democrático de Derecho. La soberanía nacional reside en el pueblo español. La forma política es la Monarquía parlamentaria.

**Reforma constitucional**
- Reforma ordinaria (art. 167): mayoría de tres quintos de cada Cámara.
- Reforma agravada (art. 168): para el Título Preliminar, Sección 1.ª del Capítulo II del Título I y el Título II. Requiere mayoría de dos tercios, disolución de las Cortes, ratificación de las nuevas Cámaras y referéndum.`,
        keywords: ['Constitución', '1978', 'valores superiores', 'soberanía', 'Monarquía parlamentaria', 'art. 1', 'reforma constitucional'],
        laws: ['CE art. 1', 'CE art. 167', 'CE art. 168'],
        dates: ['6 dic 1978 — referéndum', '29 dic 1978 — ratificación'],
      },
      {
        id: 'c2',
        title: 'Derechos fundamentales y libertades públicas',
        summary: 'Catálogo de derechos constitucionales, su protección y límites. Especial referencia al derecho de acceso a la cultura y archivos.',
        content: `Los derechos fundamentales se recogen en el Capítulo II del Título I (arts. 14-38). Se dividen en dos secciones con diferente nivel de protección.

**Sección 1.ª — Derechos Fundamentales y Libertades Públicas (arts. 14-29)**
Protegidos por recurso de amparo ante el TC y procedimiento preferente y sumario ante los tribunales ordinarios. Incluyen:
- Igualdad ante la ley (art. 14)
- Derecho a la vida e integridad física (art. 15)
- Libertad ideológica y religiosa (art. 16)
- Derecho a la información (art. 20)
- **Derecho a comunicar y recibir información veraz** — relevante para el acceso a documentos de archivo

**Sección 2.ª — Derechos y deberes de los ciudadanos (arts. 30-38)**
- Derecho a la educación (art. 27)
- **Derecho al acceso a la cultura** (art. 44) — los poderes públicos promoverán y tutelarán el acceso a la cultura

**Principios rectores de la política social y económica (arts. 39-52)**
El art. 44 establece que los poderes públicos promoverán y tutelarán el acceso a la cultura a la que todos tienen derecho. Conecta directamente con la función de los archivos como garantes del patrimonio documental.

**Garantías**
- Recurso de inconstitucionalidad
- Recurso de amparo ante el Tribunal Constitucional
- Defensor del Pueblo`,
        keywords: ['derechos fundamentales', 'recurso de amparo', 'art. 44', 'acceso a la cultura', 'Tribunal Constitucional', 'Defensor del Pueblo'],
        laws: ['CE art. 14', 'CE art. 20', 'CE art. 44'],
        dates: [],
      },
      {
        id: 'c3',
        title: 'Organización territorial del Estado',
        summary: 'Estado de las Autonomías. Comunidades Autónomas y competencias en materia de archivos y patrimonio documental.',
        content: `El Título VIII de la CE (arts. 137-158) regula la organización territorial del Estado en municipios, provincias y Comunidades Autónomas.

**Estado de las Autonomías**
España se organiza territorialmente en 17 Comunidades Autónomas y 2 Ciudades Autónomas (Ceuta y Melilla). El modelo es asimétrico y flexible, basado en el principio dispositivo.

**Competencias en materia de archivos**
El art. 148.1.15 CE permite a las CCAA asumir competencias sobre "museos, bibliotecas y conservatorios de música de interés para la Comunidad Autónoma". La mayoría ha ampliado esta competencia a los archivos mediante sus Estatutos.

**Distribución competencial en archivos**
- **Competencia exclusiva estatal** (art. 149.1.28): archivos de titularidad estatal, sin perjuicio de su gestión por las CCAA.
- **Competencia autonómica**: archivos no de titularidad estatal. Cada CCAA ha desarrollado su propia legislación archivística.

**El Sistema Español de Archivos**
Integra los archivos de todas las Administraciones Públicas mediante mecanismos de cooperación. El Consejo de Cooperación Archivística coordina la política archivística nacional.`,
        keywords: ['Comunidades Autónomas', 'art. 148', 'art. 149', 'competencias', 'Sistema Español de Archivos', 'patrimonio documental'],
        laws: ['CE art. 137', 'CE art. 148.1.15', 'CE art. 149.1.28'],
        dates: [],
      },
    ],
  },
  {
    id: 'legislacion',
    label: 'Legislación Archivística',
    icon: 'FileText',
    color: '#059669',
    bg: '#ECFDF5',
    estimatedMinutes: 60,
    topics: [
      {
        id: 'l1',
        title: 'Ley 16/1985 del Patrimonio Histórico Español',
        summary: 'Marco jurídico fundamental del patrimonio cultural. Patrimonio Documental y Bibliográfico. Archivos, Bibliotecas y Museos.',
        content: `La Ley 16/1985, de 25 de junio, del Patrimonio Histórico Español (LPHE) es la norma básica estatal en materia de patrimonio cultural.

**Estructura**
La LPHE consta de 9 Títulos y disposiciones adicionales. El Título VII (arts. 48-66) regula específicamente el Patrimonio Documental y Bibliográfico, y los Archivos, Bibliotecas y Museos.

**Patrimonio Documental (art. 49)**
Integran el Patrimonio Documental los documentos de cualquier época generados, conservados o reunidos por:
- Organismos de la Administración del Estado, CCAA y entidades locales
- Entidades y asociaciones políticas, sindicales o religiosas con más de 40 años de antigüedad
- Personas físicas o jurídicas con más de 100 años de antigüedad

**Archivos (art. 59)**
Son Archivos los conjuntos orgánicos de documentos, o la reunión de varios de ellos, reunidos por las personas jurídicas, públicas o privadas, en el ejercicio de sus actividades, al servicio de su utilización para la investigación, la cultura, la información y la gestión administrativa.

**Bienes de Interés Cultural**
La BIC es la máxima categoría de protección del patrimonio. Los archivos históricos de especial relevancia pueden ser declarados BIC.

**Obligaciones de los titulares**
- Conservar y custodiar el patrimonio documental
- Permitir el acceso a investigadores
- Comunicar a la Administración cualquier intento de exportación`,
        keywords: ['Ley 16/1985', 'LPHE', 'Patrimonio Histórico', 'Patrimonio Documental', 'BIC', 'art. 49', 'art. 59'],
        laws: ['Ley 16/1985, de 25 de junio', 'LPHE art. 49', 'LPHE art. 59'],
        dates: ['25 jun 1985 — aprobación LPHE', '40 años — antigüedad entidades', '100 años — antigüedad personas físicas'],
      },
      {
        id: 'l2',
        title: 'Ley 19/2013 de Transparencia y Acceso a la Información',
        summary: 'Derecho de acceso a la información pública. Límites y garantías. El Consejo de Transparencia y Buen Gobierno.',
        content: `La Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública y buen gobierno establece el marco general del derecho de acceso a la información en España.

**Ámbito de aplicación**
La ley se aplica a toda la Administración Pública, organismos autónomos, entidades públicas empresariales y partidos políticos, organizaciones sindicales y empresariales que reciban subvenciones públicas.

**Publicidad activa (arts. 5-11)**
Las Administraciones deben publicar de forma proactiva:
- Información institucional y organizativa
- Información de relevancia jurídica
- Información económica, presupuestaria y estadística

**Derecho de acceso (arts. 12-24)**
Cualquier persona puede solicitar acceso a información pública sin necesidad de motivar su solicitud. El plazo de resolución es de **1 mes**, ampliable a otro mes más.

**Límites al acceso**
- Seguridad nacional
- Defensa
- Relaciones exteriores
- Seguridad pública
- Prevención, investigación y sanción de ilícitos
- Igualdad de las partes en procesos judiciales
- Protección de datos personales

**El Consejo de Transparencia y Buen Gobierno**
Organismo independiente que vela por el cumplimiento de las obligaciones de transparencia y garantiza el derecho de acceso. Conoce las reclamaciones en vía administrativa.

**Relación con los archivos**
La ley refuerza la función archivística como garante del acceso a la documentación pública. Los archivos son instrumentos esenciales para garantizar la transparencia.`,
        keywords: ['transparencia', 'acceso información', 'Ley 19/2013', 'publicidad activa', 'Consejo de Transparencia', '1 mes', 'datos personales'],
        laws: ['Ley 19/2013, de 9 de diciembre', 'LTBG art. 12', 'LTBG art. 17'],
        dates: ['9 dic 2013 — aprobación', '1 mes — plazo resolución'],
      },
      {
        id: 'l3',
        title: 'Real Decreto 1708/2011 — Sistema Español de Archivos',
        summary: 'Organización y estructura del Sistema Español de Archivos. Subdirección General de Archivos Estatales. CIDA.',
        content: `El Real Decreto 1708/2011, de 18 de noviembre, establece el Sistema Español de Archivos y regula el Sistema de Archivos de la Administración General del Estado y de sus Organismos Públicos y su régimen de acceso.

**El Sistema Español de Archivos**
Integra el conjunto de archivos existentes en España, articulando la cooperación entre:
- Archivos de la Administración General del Estado
- Archivos de las CCAA
- Archivos de las Entidades Locales
- Archivos de otras entidades públicas y privadas

**El Consejo de Cooperación Archivística**
Órgano colegiado de cooperación entre el Estado y las CCAA. Funciones:
- Proponer medidas para el desarrollo del Sistema Español de Archivos
- Informar sobre disposiciones normativas en materia archivística
- Fomentar la cooperación entre archivos

**Sistema de Archivos de la AGE**
Se organiza en:
- **Archivos de gestión u oficina**: documentación en tramitación
- **Archivos centrales**: documentación transferida de los archivos de gestión
- **Archivo General de la Administración (AGA)**: archivo intermedio de la AGE
- **Archivos históricos**: custodia permanente

**La Subdirección General de los Archivos Estatales**
Depende de la Dirección General de Bellas Artes. Competencias:
- Proponer y ejecutar la política archivística del Estado
- Gestionar los Archivos Históricos Nacionales
- Coordinar el Sistema de Archivos de la AGE`,
        keywords: ['RD 1708/2011', 'Sistema Español de Archivos', 'Consejo de Cooperación Archivística', 'AGA', 'SGAE', 'archivos de gestión', 'archivos históricos'],
        laws: ['RD 1708/2011, de 18 de noviembre'],
        dates: ['18 nov 2011 — aprobación RD 1708/2011'],
      },
    ],
  },
  {
    id: 'historia',
    label: 'Historia de los Archivos',
    icon: 'History',
    color: '#7C3AED',
    bg: '#F5F3FF',
    estimatedMinutes: 50,
    topics: [
      {
        id: 'h1',
        title: 'Orígenes y evolución histórica de los archivos',
        summary: 'De los archivos palaciales de la Antigüedad a los Archivos Generales del Estado moderno. Evolución del concepto de archivo.',
        content: `La historia de los archivos es tan antigua como la escritura misma. Desde las primeras civilizaciones, la necesidad de conservar documentos que acreditaran derechos, obligaciones y decisiones fue el motor de los archivos.

**Mesopotamia y Egipto (3000-500 a.C.)**
Los primeros archivos conocidos son los depósitos de tablillas cuneiformes de Mesopotamia. El archivo de **Ebla** (Siria, ca. 2400 a.C.) conservaba más de 17.000 tablillas administrativas. En Egipto, los archivos de los templos y del faraón custodiaban los registros fiscales y administrativos en papiro.

**Grecia y Roma**
En Atenas, el **Metroon** (s. V a.C.) era el depósito de los documentos oficiales del Estado. Roma desarrolló el **Aerarium** (Tesoro público) y el **Tabularium** (archivo del Estado), construido en el año 78 a.C. y cuyos restos aún subsisten en el Foro Romano.

**Edad Media**
Los archivos medievales se concentraron en:
- **Archivos eclesiásticos**: custodias de monasterios y catedrales
- **Archivos regios**: cancillerías de los reinos
- **Archivo de la Corona de Aragón** (Barcelona, 1318): considerado el primer archivo público moderno de Europa

**Los grandes archivos del Estado Moderno**
La centralización del poder en la Monarquía Hispánica impulsó la creación de grandes archivos:
- **Archivo General de Simancas** (1540): creado por Carlos I para custodiar los documentos de la Monarquía
- **Archivo General de Indias** (Sevilla, 1785): creado por Carlos III para centralizar la documentación americana`,
        keywords: ['Ebla', 'Tabularium', 'Corona de Aragón', '1318', 'Simancas', '1540', 'Archivo de Indias', '1785', 'Metroon'],
        laws: [],
        dates: ['ca. 2400 a.C. — archivo de Ebla', '78 a.C. — Tabularium romano', '1318 — Archivo Corona de Aragón', '1540 — Archivo de Simancas', '1785 — Archivo General de Indias'],
      },
      {
        id: 'h2',
        title: 'Los grandes archivos históricos españoles',
        summary: 'Historia, fondos y funciones del AHN, AGA, AGS, AGI, ACA y Archivo de la Chancillería de Valladolid.',
        content: `España cuenta con una red de archivos históricos estatales de extraordinario valor para la investigación histórica.

**Archivo General de Simancas (AGS)**
Fundado por Carlos I en 1540 en el castillo de Simancas (Valladolid). Felipe II lo organizó definitivamente. Custodia la documentación de la Monarquía Hispánica desde el siglo XV hasta el XVIII. Es el archivo más importante de la historia moderna española y europea.

**Archivo General de Indias (AGI)**
Creado por Real Cédula de Carlos III en 1785 en la Lonja de Sevilla. Concentra toda la documentación relativa a la administración colonial americana. Declarado Patrimonio de la Humanidad por la UNESCO en 1987. Custodia unos **90 millones de páginas**.

**Archivo de la Corona de Aragón (ACA)**
Fundado en Barcelona en 1318 bajo Jaime II. Es el archivo real más antiguo de Europa en funcionamiento continuo. Custodia los documentos de la Corona de Aragón desde el siglo IX.

**Archivo Histórico Nacional (AHN)**
Creado en Madrid en 1866 para custodiar los fondos documentales de las instituciones suprimidas por la desamortización. Es el archivo histórico más extenso de España.

**Archivo General de la Administración (AGA)**
Creado en 1969 en Alcalá de Henares. Funciona como archivo intermedio de la Administración General del Estado, recibiendo documentación con antigüedad superior a 15 años.

**Archivo de la Real Chancillería de Valladolid**
Custodia la documentación del principal tribunal de justicia de la Corona de Castilla (ss. XV-XIX). Especialmente relevante para la historia del derecho y la genealogía.`,
        keywords: ['AGS', 'AGI', 'ACA', 'AHN', 'AGA', 'Simancas', 'Indias', 'Corona de Aragón', '1866', '1969', 'Alcalá de Henares', 'UNESCO'],
        laws: [],
        dates: ['1318 — ACA', '1540 — AGS', '1785 — AGI', '1866 — AHN', '1969 — AGA', '1987 — AGI Patrimonio UNESCO'],
      },
    ],
  },
  {
    id: 'archivistica',
    label: 'Archivística: Fundamentos y Gestión',
    icon: 'Archive',
    color: '#D97706',
    bg: '#FFFBEB',
    estimatedMinutes: 70,
    topics: [
      {
        id: 'a1',
        title: 'Concepto y principios fundamentales de la Archivística',
        summary: 'Definición de archivo y documento. Principio de procedencia y respeto al orden original. Ciclo vital de los documentos.',
        content: `La Archivística es la disciplina científica que estudia los principios teóricos y los métodos de organización y funcionamiento de los archivos.

**Definición de Archivo**
Según la Ley 16/1985 (art. 59): conjunto orgánico de documentos, o la reunión de varios de ellos, reunidos por las personas jurídicas, públicas o privadas, en el ejercicio de sus actividades, al servicio de su utilización para la investigación, la cultura, la información y la gestión administrativa.

**Definición de Documento de Archivo**
Toda expresión en lenguaje natural o convencional y cualquier otra expresión gráfica, sonora o en imagen, recogidas en cualquier tipo de soporte material, incluso los soportes informáticos. Para ser documento de archivo debe ser:
- Generado o recibido por una institución o persona
- En el ejercicio de sus funciones
- Con carácter seriado y orgánico

**Principios fundamentales**

**1. Principio de procedencia**
Los documentos de un fondo deben permanecer agrupados según su origen, sin mezclarse con los de otros fondos. Formulado por el archivero francés Natalis de Wailly en 1841.

**2. Principio de respeto al orden original (u orden natural)**
Dentro de cada fondo, los documentos deben conservarse en el orden en que fueron organizados por la institución que los produjo.

**Ciclo vital de los documentos**
Concepto propuesto por Theodore Schellenberg. Los documentos pasan por tres fases:
- **Fase activa**: documentos en tramitación (archivo de oficina/gestión)
- **Fase semiactiva**: documentos con vigencia administrativa pero consulta esporádica (archivo central/intermedio)
- **Fase inactiva o histórica**: documentos sin vigencia administrativa pero con valor histórico (archivo histórico)`,
        keywords: ['principio de procedencia', 'orden original', 'Natalis de Wailly', '1841', 'Schellenberg', 'ciclo vital', 'archivo de gestión', 'archivo histórico'],
        laws: ['LPHE art. 59'],
        dates: ['1841 — principio de procedencia (Wailly)'],
      },
      {
        id: 'a2',
        title: 'Clasificación y ordenación de fondos',
        summary: 'Sistemas de clasificación documental. Cuadro de clasificación. Sistemas de ordenación. Agrupaciones documentales.',
        content: `La clasificación y ordenación son operaciones intelectuales y físicas mediante las cuales se organiza el fondo documental de un archivo.

**Agrupaciones documentales**
De mayor a menor nivel jerárquico:
1. **Grupo de fondos**: conjunto de fondos relacionados por su procedencia
2. **Fondo**: conjunto orgánico de documentos generados por una entidad
3. **Sección de fondo**: subdivisión del fondo según las funciones de la entidad
4. **Serie documental**: conjunto de documentos del mismo tipo generados por la misma función
5. **Unidad documental compuesta (expediente)**: conjunto de documentos relacionados por un mismo asunto
6. **Unidad documental simple (documento)**: unidad mínima de la descripción

**Clasificación**
La clasificación es la operación de agrupar jerárquicamente los documentos según su procedencia y funciones. El instrumento resultante es el **cuadro de clasificación**.

**Sistemas de clasificación:**
- **Funcional**: basado en las funciones y actividades de la entidad productora (recomendado)
- **Orgánico**: basado en la estructura orgánica de la entidad
- **Por materias**: basado en el contenido temático (desaconsejado en archivos)

**Ordenación**
La ordenación es la operación de disponer físicamente los documentos dentro de las series. Sistemas:
- **Cronológica**: por fechas (muy frecuente en series administrativas)
- **Alfabética**: por nombres, lugares o materias
- **Numérica**: por números de expediente o registro
- **Alfanumérica**: combinación de letras y números
- **Geográfica**: por lugares`,
        keywords: ['fondo', 'serie documental', 'expediente', 'cuadro de clasificación', 'clasificación funcional', 'clasificación orgánica', 'ordenación cronológica'],
        laws: [],
        dates: [],
      },
      {
        id: 'a3',
        title: 'Descripción archivística y normas internacionales',
        summary: 'ISAD(G), ISAAR(CPF), ISDF, ISDIAH. La norma española NEDA. PARES. EAD.',
        content: `La descripción archivística es el proceso de análisis de los documentos de archivo o de sus agrupaciones, materializado en representaciones que permiten su identificación, localización y recuperación.

**Descripción multinivel**
La descripción se realiza en varios niveles que van de lo general a lo particular:
- Nivel 1: Fondo
- Nivel 2: Sección
- Nivel 3: Serie
- Nivel 4: Unidad documental compuesta (expediente)
- Nivel 5: Unidad documental simple (documento)

**Normas internacionales del ICA**

**ISAD(G) — Norma Internacional General de Descripción Archivística**
Aprobada en 1994, revisada en 2000. Establece 26 elementos de descripción organizados en 7 áreas:
1. Área de identificación
2. Área de contexto
3. Área de contenido y estructura
4. Área de condiciones de acceso y uso
5. Área de documentación asociada
6. Área de notas
7. Área de control de la descripción

**ISAAR(CPF) — Norma Internacional sobre los Registros de Autoridad de Archivos relativos a Corporaciones, Personas y Familias** (1996, revisada 2004)

**ISDF — Norma Internacional para la Descripción de Funciones** (2007)

**ISDIAH — Norma Internacional para Describir Instituciones que Custodian Fondos de Archivo** (2008)

**Norma española: NEDA**
La Comisión de Normas Españolas de Descripción Archivística (CNEDA) elabora las normas adaptadas al contexto español.

**PARES — Portal de Archivos Españoles**
Plataforma digital del Ministerio de Cultura que ofrece acceso libre a los fondos digitalizados de los archivos estatales españoles.`,
        keywords: ['ISAD(G)', 'ISAAR(CPF)', 'ISDF', 'ISDIAH', 'NEDA', 'PARES', 'ICA', 'descripción multinivel', '1994', '2000'],
        laws: [],
        dates: ['1994 — ISAD(G) 1ª edición', '2000 — ISAD(G) 2ª edición', '2004 — ISAAR(CPF) revisión', '2007 — ISDF', '2008 — ISDIAH'],
      },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestión Documental',
    icon: 'Layers',
    color: '#0891B2',
    bg: '#ECFEFF',
    estimatedMinutes: 55,
    topics: [
      {
        id: 'g1',
        title: 'El documento electrónico y el expediente electrónico',
        summary: 'Ley 39/2015 y Ley 40/2015. El documento electrónico en la AGE. Metadatos. Firma electrónica.',
        content: `La administración electrónica ha transformado radicalmente la gestión documental. La Ley 39/2015 y la Ley 40/2015 establecen el marco jurídico del documento y expediente electrónico en España.

**Documento electrónico**
Según la Ley 39/2015 (art. 26): información de cualquier naturaleza en forma electrónica, archivada en un soporte electrónico según un formato determinado y susceptible de identificación y tratamiento diferenciado.

**Requisitos del documento electrónico válido**
- Contener datos identificativos del emisor
- Firmado electrónicamente cuando sea necesario
- Numerado convenientemente
- Fechado electrónicamente

**Firma electrónica**
- **Firma electrónica simple**: datos asociados al firmante
- **Firma electrónica avanzada**: vinculada de forma única al firmante
- **Firma electrónica cualificada**: basada en certificado cualificado; equivale a la firma manuscrita

**El Expediente Electrónico (art. 70 Ley 39/2015)**
Conjunto de documentos electrónicos correspondientes a un procedimiento administrativo. Debe incluir:
- Índice electrónico (garantiza la integridad del expediente)
- Identificación del expediente
- Documentos que lo integran
- Firma del índice

**Metadatos**
Datos que describen el contexto, contenido y estructura de los documentos. Esenciales para garantizar la autenticidad, fiabilidad, integridad y disponibilidad del documento electrónico a largo plazo.

**Política de gestión de documentos electrónicos**
La Ley 40/2015 obliga a las AAPP a aprobar una política de gestión de documentos electrónicos que defina los principios y responsabilidades en la gestión documental.`,
        keywords: ['documento electrónico', 'expediente electrónico', 'Ley 39/2015', 'Ley 40/2015', 'firma electrónica cualificada', 'metadatos', 'índice electrónico'],
        laws: ['Ley 39/2015, de 1 de octubre', 'Ley 40/2015, de 1 de octubre', 'Ley 39/2015 art. 26', 'Ley 39/2015 art. 70'],
        dates: ['1 oct 2015 — Ley 39/2015 y 40/2015'],
      },
      {
        id: 'g2',
        title: 'Valoración, selección y eliminación de documentos',
        summary: 'Valores primarios y secundarios. Tablas de valoración. La Comisión Superior Calificadora de Documentos Administrativos.',
        content: `La valoración documental es el proceso intelectual mediante el cual se determina el valor de los documentos a efectos de su conservación permanente o eliminación.

**Valores del documento**
**Valores primarios (Schellenberg)**
Vigencia del documento para la institución productora:
- **Valor administrativo**: utilidad para la gestión corriente
- **Valor jurídico-legal**: derechos y obligaciones de la entidad
- **Valor fiscal**: acredita transacciones económicas
- **Valor informativo**: información sobre personas, lugares y cosas

**Valores secundarios**
Interés para la investigación y la cultura tras perder el valor primario:
- **Valor histórico-testimonial**: refleja la organización y funciones de la entidad
- **Valor histórico-informativo**: información sobre personas, lugares y hechos

**El proceso de valoración**
1. **Identificación** de la serie documental
2. **Estudio** de la normativa reguladora
3. **Análisis** del contenido y valores
4. **Propuesta** de conservación, eliminación o muestreo
5. **Dictamen** de la Comisión Calificadora

**La Comisión Superior Calificadora de Documentos Administrativos (CSCDA)**
Órgano colegiado adscrito al Ministerio de Cultura. Funciones:
- Estudiar y dictaminar sobre el valor de los documentos
- Autorizar la eliminación de series documentales
- Proponer la conservación permanente

**Tablas de valoración documental**
Instrumentos técnicos que recogen los plazos de transferencia, conservación y eliminación para cada serie documental.`,
        keywords: ['valoración', 'Schellenberg', 'valores primarios', 'valores secundarios', 'CSCDA', 'tablas de valoración', 'eliminación', 'muestreo'],
        laws: ['RD 1708/2011'],
        dates: [],
      },
    ],
  },
  {
    id: 'conservacion',
    label: 'Conservación y Digitalización',
    icon: 'Shield',
    color: '#DC2626',
    bg: '#FEF2F2',
    estimatedMinutes: 40,
    topics: [
      {
        id: 'con1',
        title: 'Conservación preventiva y restauración',
        summary: 'Causas de deterioro de los soportes documentales. Medidas de conservación preventiva. Condiciones ambientales.',
        content: `La conservación tiene como objetivo garantizar la preservación de los documentos a largo plazo, tanto en su soporte físico como en su contenido informativo.

**Soportes documentales**
- **Papel**: soporte más común. Compuesto de celulosa. Susceptible a hidrólisis ácida, oxidación, luz UV, hongos e insectos.
- **Pergamino**: piel animal tratada. Muy sensible a la humedad y temperatura.
- **Soporte fotográfico**: gelatino-bromuro de plata, nitrato y acetato de celulosa, poliéster.
- **Soporte magnético**: cintas de vídeo y audio, discos magnéticos.
- **Soporte óptico**: CD, DVD, Blu-ray. Susceptibles a delamination.

**Causas de deterioro**
- **Factores intrínsecos**: acidez del papel (lignina), inestabilidad química
- **Factores extrínsecos**:
  - Temperatura y humedad inadecuadas
  - Luz (especialmente UV)
  - Contaminantes atmosféricos
  - Agentes biológicos (hongos, bacterias, insectos, roedores)
  - Desastres (incendios, inundaciones)
  - Mal uso y manipulación

**Condiciones ambientales recomendadas**
- Papel: temperatura 16-19°C, humedad relativa 45-55%
- Fotografía en blanco y negro: temperatura < 15°C, HR 30-40%
- Color: temperatura < 5°C (almacén frío)
- Soportes magnéticos: temperatura 10-18°C, HR 30-40%

**Conservación preventiva**
Conjunto de medidas para evitar el deterioro antes de que se produzca:
- Control ambiental
- Instalaciones adecuadas (cajas, carpetas, estanterías)
- Planes de emergencia y evacuación
- Formación del personal
- Sistemas de detección y extinción de incendios`,
        keywords: ['conservación preventiva', 'soporte documental', 'papel', 'pergamino', 'humedad relativa', 'temperatura', 'luz UV', 'hongos', 'lignina'],
        laws: [],
        dates: [],
      },
      {
        id: 'con2',
        title: 'Digitalización del patrimonio documental',
        summary: 'Proyectos de digitalización. Estándares técnicos. Preservación digital a largo plazo. OAIS. PREMIS.',
        content: `La digitalización es el proceso de conversión de documentos analógicos a formato digital, con el objetivo de facilitar su acceso y preservar los originales.

**Objetivos de la digitalización**
- Facilitar el acceso remoto a los fondos
- Reducir la manipulación de originales frágiles
- Crear copias de seguridad digitales
- Difundir el patrimonio documental

**Estándares de calidad técnica**

**Resolución (ppp — puntos por pulgada)**
- Documentos textuales normales: 300 ppp mínimo
- Documentos con detalles finos: 400-600 ppp
- Fotografías: 400-600 ppp
- Microfilm: 400-600 ppp
- Mapas y planos: 400 ppp mínimo

**Formatos de archivo**
- **TIFF**: formato maestro sin pérdida, recomendado para preservación
- **JPEG2000**: compresión con o sin pérdida, admite metadatos
- **PDF/A**: formato para preservación de documentos textuales
- **PNG**: sin pérdida, para documentos con fondos transparentes

**Preservación digital**
La preservación digital garantiza la accesibilidad a largo plazo de los objetos digitales.

**Modelo OAIS (Open Archival Information System)**
ISO 14721:2012. Marco conceptual para la gestión de archivos digitales. Define los flujos de información:
- **SIP** (Submission Information Package): paquete de envío
- **AIP** (Archival Information Package): paquete de archivo
- **DIP** (Dissemination Information Package): paquete de difusión

**PREMIS (PREservation Metadata Implementation Strategies)**
Esquema de metadatos para la preservación digital. Gestiona los eventos que afectan a los objetos digitales.`,
        keywords: ['digitalización', 'TIFF', 'JPEG2000', 'PDF/A', 'OAIS', 'PREMIS', 'SIP', 'AIP', 'DIP', '300 ppp', 'ISO 14721'],
        laws: ['ISO 14721:2012'],
        dates: [],
      },
    ],
  },
]

export default STUDY_BLOCKS
