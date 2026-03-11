// Temario oficial — Cuerpo Facultativo de Archiveros, Bibliotecarios y Arqueólogos
// Sección Archivos — Ministerio de Cultura — BOE nº 300, 13 dic 2024
// Bloques alineados con questions.json: historia, constitucion, legislacion,
// gestion, descripcion, normas, conservacion, digitalizacion

export const STUDY_BLOCKS = [

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: CONSTITUCIÓN Y ORGANIZACIÓN DEL ESTADO
  // ═══════════════════════════════════════════════════════════
  {
    id: 'constitucion',
    label: 'Constitución y Organización del Estado',
    icon: 'Scale',
    color: '#2563EB',
    bg: '#EFF6FF',
    estimatedMinutes: 95,
    topics: [
      {
        id: 'c1',
        title: 'La Constitución Española de 1978: estructura y elaboración',
        summary: 'Proceso constituyente, los Padres de la Constitución, estructura formal con 169 artículos y 10 Títulos, valores superiores, principios del Título Preliminar y los dos procedimientos de reforma.',
        content: `La Constitución Española de 1978 (CE) es la norma suprema del ordenamiento jurídico español. Fue aprobada por las Cortes Generales el 31 de octubre de 1978, ratificada por referéndum el 6 de diciembre de 1978 y sancionada por el Rey el 27 de diciembre de 1978, entrando en vigor el 29 de diciembre de 1978 con su publicación en el BOE.

**Proceso constituyente**
Tras la muerte de Franco el 20 de noviembre de 1975 y la aprobación de la Ley para la Reforma Política de 1976, se celebraron las primeras elecciones generales democráticas el 15 de junio de 1977. Las Cortes Constituyentes elaboraron la CE a través de una ponencia de siete diputados, conocidos como los "Padres de la Constitución":
- Gabriel Cisneros Laborda (UCD)
- José Pedro Pérez-Llorca (UCD)
- Miguel Herrero de Miñón (UCD)
- Gregorio Peces-Barba (PSOE)
- Jordi Solé Tura (PCE-PSUC)
- Manuel Fraga Iribarne (AP)
- Miquel Roca i Junyent (CiU)

**Estructura formal de la CE**
La CE consta de Preámbulo + 169 artículos organizados en:
- Título Preliminar (arts. 1-9): principios fundamentales del Estado
- Título I: "De los derechos y deberes fundamentales" (arts. 10-55)
- Título II: "De la Corona" (arts. 56-65)
- Título III: "De las Cortes Generales" (arts. 66-96)
- Título IV: "Del Gobierno y de la Administración" (arts. 97-107)
- Título V: "De las relaciones entre el Gobierno y las Cortes" (arts. 108-116)
- Título VI: "Del Poder Judicial" (arts. 117-127)
- Título VII: "Economía y Hacienda" (arts. 128-136)
- Título VIII: "De la Organización Territorial del Estado" (arts. 137-158)
- Título IX: "Del Tribunal Constitucional" (arts. 159-165)
- Título X: "De la Reforma Constitucional" (arts. 166-169)
- 4 Disposiciones Adicionales + 9 Transitorias + 1 Derogatoria + 1 Final

**Valores superiores del ordenamiento jurídico (art. 1.1)**
España se constituye en Estado social y democrático de Derecho que propugna como valores superiores: libertad, justicia, igualdad y pluralismo político.

**Principios fundamentales (Título Preliminar)**
- Art. 1.2: La soberanía nacional reside en el pueblo español
- Art. 1.3: La forma política del Estado español es la Monarquía parlamentaria
- Art. 2: Unidad indisoluble de la Nación española; autonomía de nacionalidades y regiones
- Art. 3.1: El castellano es la lengua oficial del Estado
- Art. 9.3: Garantiza la legalidad, jerarquía normativa, publicidad de las normas, irretroactividad de disposiciones sancionadoras no favorables, seguridad jurídica, responsabilidad e interdicción de la arbitrariedad
- Art. 9.2: Corresponde a los poderes públicos promover las condiciones para que la igualdad del individuo y los grupos en que se integra sean reales y efectivas

**Reforma constitucional (Título X)**
Procedimiento ordinario (art. 167): aprobación por 3/5 de cada Cámara. Si no hay acuerdo, comisión mixta. Si tampoco, mayoría absoluta del Senado y 2/3 del Congreso. Referéndum facultativo si lo solicita 1/10 de los parlamentarios en 15 días.

Procedimiento agravado (art. 168): Para revisión total o parcial del Título Preliminar, Sección 1.ª del Cap. II del Título I y Título II (Corona). Requiere: 2/3 de cada Cámara → disolución automática de las Cortes → ratificación por nuevas Cámaras con mayoría de 2/3 → referéndum obligatorio.

Solo se ha reformado dos veces: art. 13.2 en 1992 (voto extranjeros municipales, Tratado Maastricht) y art. 135 en 2011 (estabilidad presupuestaria, crisis financiera).`,
        keywords: ['Constitución Española', '169 artículos', 'Padres de la Constitución', 'valores superiores', 'soberanía nacional', 'Monarquía parlamentaria', 'art. 1.1', 'art. 9.3', 'reforma constitucional', 'art. 167', 'art. 168', '6 dic 1978', 'Título Preliminar'],
        laws: ['CE art. 1', 'CE art. 2', 'CE art. 9.3', 'CE art. 167', 'CE art. 168'],
        dates: ['20 nov 1975 — muerte de Franco', '15 jun 1977 — primeras elecciones democráticas', '31 oct 1978 — aprobación CE por Cortes', '6 dic 1978 — referéndum', '29 dic 1978 — entrada en vigor', '1992 — 1.ª reforma (art. 13.2)', '2011 — 2.ª reforma (art. 135)'],
      },
      {
        id: 'c2',
        title: 'Derechos fundamentales y sistema de garantías',
        summary: 'Clasificación de los derechos del Título I, niveles de protección, recurso de amparo ante el TC, Defensor del Pueblo. Artículos 44 y 46 como base constitucional de archivos y patrimonio.',
        content: `El Título I "De los derechos y deberes fundamentales" (arts. 10-55) es el núcleo de la CE. El art. 10 reconoce la dignidad de la persona y los derechos inviolables como fundamento del orden político, y ordena interpretar los derechos conforme a la Declaración Universal de DDHH y los tratados internacionales ratificados por España.

**Capítulo I — Españoles y extranjeros (arts. 11-13)**
Mayoría de edad: 18 años (art. 12). Los extranjeros gozan de las libertades públicas garantizadas en el Título I en los términos establecidos por los tratados y la ley.

**Capítulo II — Derechos y libertades (arts. 14-38)**

Sección 1.ª — Derechos fundamentales y libertades públicas (arts. 14-29):
Máxima protección: amparo ante el TC (art. 53.2), procedimiento preferente y sumario ante tribunales ordinarios. Se desarrollan SOLO por Ley Orgánica:
- Art. 14: Igualdad ante la ley; prohibición de discriminación por nacimiento, raza, sexo, religión, opinión o cualquier condición
- Art. 15: Derecho a la vida e integridad física y moral; abolición de la pena de muerte
- Art. 16: Libertad ideológica, religiosa y de culto; ninguna confesión estatal
- Art. 17: Libertad personal; habeas corpus; detención máx. 72 horas
- Art. 18: Derecho al honor, intimidad y propia imagen; inviolabilidad del domicilio; secreto de las comunicaciones; protección de datos
- Art. 19: Libre circulación y residencia; derecho a entrar y salir libremente de España
- Art. 20: Libertad de expresión, producción y creación literaria/artística/científica; libertad de información; cláusula de conciencia
- Art. 21: Derecho de reunión pacífica y sin armas
- Art. 22: Derecho de asociación; asociaciones ilegales: persiguen fines delictivos, usan medios delictivos o son secretas
- Art. 23: Participar en asuntos públicos; acceso a funciones y cargos públicos en condiciones de igualdad
- Art. 24: Tutela judicial efectiva; proceso sin dilaciones indebidas; presunción de inocencia; no declarar contra uno mismo
- Art. 25: Principio de legalidad penal (no hay pena sin ley previa); trabajo no obligatorio salvo en penas
- Art. 27: Derecho a la educación; libertad de enseñanza; educación básica obligatoria y gratuita
- Art. 28: Derecho de sindicación y huelga
- Art. 29: Derecho de petición individual y colectiva

Sección 2.ª — Derechos y deberes de los ciudadanos (arts. 30-38):
Protegidos por ley ordinaria: trabajo (art. 35), propiedad privada y herencia (art. 33), libre empresa (art. 38), matrimonio (art. 32), objeción de conciencia (art. 30).

**Capítulo III — Principios rectores de la política social y económica (arts. 39-52)**
No son derechos subjetivos directamente exigibles; son mandatos al legislador que solo pueden alegarse ante la jurisdicción ordinaria según la ley que los desarrolle:
- Art. 39: Protección de la familia
- Art. 43: Derecho a la salud
- Art. 44: Los poderes públicos promoverán y tutelarán el acceso a la cultura, a la que todos tienen derecho → BASE CONSTITUCIONAL DE LOS ARCHIVOS Y BIBLIOTECAS PÚBLICAS
- Art. 45: Derecho al medioambiente
- Art. 46: Los poderes públicos garantizarán la conservación y promoverán el enriquecimiento del patrimonio histórico, cultural y artístico de los pueblos de España → BASE DEL PATRIMONIO DOCUMENTAL
- Art. 50: Tercera edad; pensiones, sanidad, servicios sociales
- Art. 51: Defensa de consumidores y usuarios

**Sistema de garantías constitucionales**
- Art. 53.1: Los derechos del Cap. II vinculan a todos los poderes públicos; solo por ley se regula su ejercicio (que debe respetar su contenido esencial)
- Art. 53.2: Cualquier ciudadano puede recabar la tutela de las libertades y derechos del art. 14 y Sec. 1.ª ante los Tribunales ordinarios por procedimiento preferente y sumario, y mediante el recurso de amparo ante el TC
- Art. 53.3: El reconocimiento y la protección de los principios del Cap. III informarán la legislación positiva, la práctica judicial y la actuación de los poderes públicos
- Art. 54: El Defensor del Pueblo es el alto comisionado de las Cortes Generales para la defensa de los derechos del Título I
- Art. 81: Son leyes orgánicas las relativas al desarrollo de los derechos fundamentales y libertades públicas (Sec. 1.ª)

**Relevancia para archivos — Art. 105.b CE**
"La ley regulará el acceso de los ciudadanos a los archivos y registros administrativos, salvo en lo que afecte a la seguridad y defensa del Estado, la averiguación de los delitos y la intimidad de las personas." Este artículo es el fundamento constitucional directo del derecho de acceso a la documentación pública.`,
        keywords: ['derechos fundamentales', 'art. 14', 'art. 20', 'art. 24', 'art. 44', 'art. 46', 'art. 53', 'art. 81', 'art. 105.b', 'recurso de amparo', 'Ley Orgánica', 'Defensor del Pueblo', 'acceso a la cultura', 'patrimonio histórico', 'tutela judicial efectiva'],
        laws: ['CE art. 10', 'CE art. 14', 'CE art. 20', 'CE art. 44', 'CE art. 46', 'CE art. 53', 'CE art. 105.b'],
        dates: [],
      },
      {
        id: 'c3',
        title: 'Cortes Generales, Gobierno y Poder Judicial',
        summary: 'Bicameralismo imperfecto: Congreso (350 diputados) y Senado. Investidura, moción de censura y cuestión de confianza. La Administración Pública (art. 103). El Poder Judicial y el CGPJ. El Tribunal Constitucional y sus 12 magistrados.',
        content: `**Las Cortes Generales (Título III, arts. 66-96)**
Representan al pueblo español. Ejercen la potestad legislativa, aprueban los PGE y controlan al Gobierno. Son inviolables (sus miembros gozan de inmunidad e inviolabilidad). Sistema bicameral IMPERFECTO: el Congreso prima sobre el Senado.

El Congreso de los Diputados:
- 350 diputados; circunscripción provincial; mínimo 2 escaños/provincia (Ceuta y Melilla: 1)
- Sistema D'Hondt con barrera electoral del 3% (sobre votos válidos de la circunscripción)
- Mandato de 4 años (legislatura)
- Funciones exclusivas: investidura del Presidente, moción de censura constructiva, cuestión de confianza, autorización del art. 155, estados de alarma/excepción/sitio

El Senado:
- Cámara de representación territorial; ~265 senadores
- 208 elegidos directamente (4 por provincia; 3 por Ceuta y Melilla; islas: variable)
- Resto designados por las CCAA (1 + 1 por cada millón de habitantes)
- Papel especial en: revisión legislativa (veto o enmiendas con plazo de 2 meses), reforma constitucional agravada

**El Gobierno (Título IV, arts. 97-107)**
Dirige la política interior y exterior, la Administración civil y militar y la defensa del Estado. Ejerce la función ejecutiva y la potestad reglamentaria de acuerdo con la CE y las leyes.
- Presidente: elegido mediante investidura por el Congreso; nombrado por el Rey; dirige y coordina la acción del Consejo de Ministros
- Vicepresidente/s: si los hubiera
- Ministros: responsables de sus departamentos; miembros del Consejo de Ministros
- Moción de censura (art. 113): constructiva (debe proponer candidato alternativo); aprobada por mayoría absoluta
- Cuestión de confianza (art. 112): el Presidente la plantea; aprobada por mayoría simple
- Decreto-ley (art. 86): en casos de extraordinaria y urgente necesidad; convalidado o derogado por el Congreso en 30 días

**La Administración Pública (arts. 103-107)**
- Art. 103.1: La Administración Pública sirve con objetividad los intereses generales y actúa de acuerdo con los principios de eficacia, jerarquía, descentralización, desconcentración y coordinación, con sometimiento pleno a la ley y al Derecho
- Art. 103.3: La ley regulará el estatuto de los funcionarios públicos; el acceso a la función pública de acuerdo con los principios de mérito y capacidad; las peculiaridades del ejercicio del derecho de sindicación
- Art. 105: La ley regulará la audiencia de ciudadanos y acceso a archivos y registros administrativos
- Art. 106: Los Tribunales controlan la legalidad de la actuación administrativa y la responsabilidad patrimonial de la Administración

**El Poder Judicial (Título VI, arts. 117-127)**
- Jueces y magistrados: independientes, inamovibles, responsables, sometidos únicamente al Imperio de la Ley
- Unidad jurisdiccional: principio básico; se prohíben tribunales de honor
- Consejo General del Poder Judicial (CGPJ): órgano de gobierno de los jueces; 20 vocales (12 entre jueces + 8 juristas de reconocido prestigio) propuestos por el Congreso (10) y el Senado (10); Presidente = Presidente del TS
- Tribunal Supremo: órgano jurisdiccional superior en todos los órdenes (civil, penal, contencioso-administrativo, social, militar)
- Ministerio Fiscal: promueve la acción de la justicia; principios: legalidad, imparcialidad, unidad de actuación y dependencia jerárquica

**El Tribunal Constitucional (Título IX, arts. 159-165)**
- 12 magistrados: 4 propuestos por el Congreso (mayoría 3/5), 4 por el Senado (3/5), 2 por el Gobierno, 2 por el CGPJ
- Mandato: 9 años; renovación por tercios cada 3 años; no reelegibles inmediatamente
- Competencias: recurso de inconstitucionalidad, cuestión de inconstitucionalidad, recurso de amparo, conflictos constitucionales de competencia, control previo de tratados internacionales`,
        keywords: ['Cortes Generales', 'Congreso', '350 diputados', 'Senado', 'D\'Hondt', '3%', 'investidura', 'moción de censura constructiva', 'cuestión de confianza', 'Gobierno', 'art. 103', 'CGPJ', 'Tribunal Constitucional', '12 magistrados', '9 años', 'Decreto-ley'],
        laws: ['CE art. 66', 'CE art. 86', 'CE art. 97', 'CE art. 103', 'CE art. 105', 'CE art. 113', 'CE art. 117', 'CE art. 159'],
        dates: [],
      },
      {
        id: 'c4',
        title: 'Organización territorial: Estado de las Autonomías',
        summary: '17 CCAA + 2 Ciudades Autónomas. Municipios, provincias y CCAA. Estatutos de Autonomía. Distribución de competencias (arts. 148-149). Art. 149.1.28 sobre archivos estatales. Art. 155: coerción estatal.',
        content: `El Título VIII (arts. 137-158) regula la organización territorial en el "Estado de las Autonomías", modelo único que combina elementos federal y unitario.

**Tres niveles territoriales (art. 137)**
1. Municipios: entidad territorial básica; gobierno por Ayuntamiento (alcalde + concejales); Ley 7/1985 LRBRL; competencias propias (urbanismo, servicios sociales, vías públicas, etc.)
2. Provincias: agrupación de municipios; gobierno por Diputación Provincial; en CCAA uniprovinciales la Diputación se integra en la institución autonómica; en País Vasco: Juntas Generales y Diputaciones Forales
3. Comunidades Autónomas: 17 CCAA + 2 ciudades autónomas (Ceuta y Melilla)

**Creación de las CCAA**
- Vía ordinaria (art. 143): iniciativa municipal + provincial; acceso gradual a competencias
- Vía reforzada (art. 151): para "nacionalidades históricas" (Cataluña, País Vasco, Galicia) y Andalucía; acceso inmediato al máximo de competencias
- Estatuto de Autonomía: norma institucional básica de cada CA; aprobado como LO

Instituciones de las CCAA:
- Asamblea Legislativa (Parlamento autonómico)
- Consejo de Gobierno y su Presidente
- Tribunal Superior de Justicia (culmina la organización judicial en la CA)

**Distribución de competencias**
Art. 148.1: Materias que pueden asumir las CCAA, entre ellas el nº 15: "Museos, bibliotecas y conservatorios de música de interés para la Comunidad Autónoma" (que se ha ampliado a archivos en los Estatutos).

Art. 149.1: Competencias exclusivas del Estado:
- Nº 1: Regulación de las condiciones básicas de igualdad
- Nº 8: Legislación civil (excepto derechos forales)
- Nº 18: Bases del régimen jurídico de las AAPP; procedimiento administrativo común
- Nº 28: Defensa del patrimonio cultural, artístico y monumental español contra la exportación y expoliación; museos, bibliotecas y ARCHIVOS DE TITULARIDAD ESTATAL, sin perjuicio de su gestión por las CCAA
- Art. 149.3: Cláusula residual en favor de las CCAA

**Art. 149.1.28 en detalle — clave para archivos**
El Estado conserva la titularidad de los grandes archivos históricos (AHN, AGS, AGI, AGA, ACA...) pero puede transferir su gestión a las CCAA. Las CCAA tienen competencia exclusiva sobre sus propios archivos. El desarrollo de la legislación archivística autonómica ha sido muy activo desde los 80.

**Mecanismos de control**
- Art. 150: Leyes de delegación, transferencia y armonización
- Art. 153: Control del TC, Gobierno, jurisdicción contencioso-administrativa y Tribunal de Cuentas
- Art. 155 — Coerción estatal: Si una CA no cumple obligaciones constitucionales o atenta gravemente contra el interés general, el Gobierno (previo requerimiento al Presidente de la CA y aprobación por mayoría absoluta del Senado) puede adoptar las medidas necesarias para obligar a su cumplimiento. Aplicado por primera vez en octubre 2017 (proceso secesionista catalán).`,
        keywords: ['Estado de las Autonomías', '17 CCAA', 'art. 148', 'art. 149.1.28', 'art. 155', 'Estatuto de Autonomía', 'archivos titularidad estatal', 'LRBRL', 'coerción estatal', 'Diputaciones Forales', 'vía art. 143', 'vía art. 151'],
        laws: ['CE art. 137', 'CE art. 143', 'CE art. 148.1.15', 'CE art. 149.1.28', 'CE art. 155', 'Ley 7/1985 LRBRL'],
        dates: ['2 abr 1985 — Ley 7/1985 LRBRL', 'oct 2017 — aplicación art. 155'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: LEGISLACIÓN ARCHIVÍSTICA
  // ═══════════════════════════════════════════════════════════
  {
    id: 'legislacion',
    label: 'Legislación Archivística',
    icon: 'FileText',
    color: '#059669',
    bg: '#ECFDF5',
    estimatedMinutes: 100,
    topics: [
      {
        id: 'l1',
        title: 'Ley 16/1985 del Patrimonio Histórico Español (LPHE)',
        summary: 'Norma básica del patrimonio cultural español. Patrimonio Documental y Bibliográfico (arts. 48-66). Bienes de Interés Cultural. Obligaciones de los titulares. Junta de Calificación.',
        content: `La Ley 16/1985, de 25 de junio, del Patrimonio Histórico Español (LPHE) es la norma básica estatal en materia de patrimonio cultural. Desarrolla los arts. 44 y 46 CE. Tiene reglamento de desarrollo parcial: RD 111/1986.

**Estructura de la LPHE**
- Título I: Disposiciones generales (arts. 1-13): BIC y bienes inventariados
- Título II: De los bienes inmuebles (arts. 14-25)
- Título III: De los bienes muebles (arts. 26-37)
- Título IV: Del Patrimonio Arqueológico (arts. 38-45)
- Título V: Del Patrimonio Etnográfico (arts. 46-47)
- Título VI: Del Patrimonio Documental y Bibliográfico, y de los Archivos, Bibliotecas y Museos (arts. 48-66)
- Título VII: Del fomento (arts. 67-71)
- Título VIII: De las infracciones y sanciones (arts. 72-79)

**Bienes de Interés Cultural (BIC)**
Son los bienes más relevantes del PHE, declarados por RD del Gobierno (a propuesta del Ministerio de Cultura) o por ministerio de la ley. Categorías de bienes inmuebles: Monumento, Jardín Histórico, Conjunto Histórico, Sitio Histórico y Zona Arqueológica. Para bienes muebles: no hay denominación formal pero requieren expediente.

**El Patrimonio Documental (arts. 48-52)**
Son parte del PHE los documentos recogidos en los archivos, con independencia del soporte, generados, conservados o reunidos en el ejercicio de sus funciones por:
- Organismos de la AGE, CCAA y corporaciones de derecho público (desde su creación)
- Entidades y asociaciones políticas, sindicales o religiosas con más de 40 años de antigüedad
- Entidades privadas que desarrollen actividades de interés público con más de 40 años
- Personas físicas o jurídicas, españolas o extranjeras, con más de 100 años de antigüedad

Exclusión de libre disposición: los propietarios de bienes del Patrimonio Documental no pueden destruirlos. Obligación de conservación y de comunicar intención de exportación.

**El Patrimonio Bibliográfico (art. 50)**
Integra las obras literarias, históricas, científicas o artísticas de carácter unitario o seriado con más de 100 años; manuscritos e incunables; ejemplares cuya producción haya cesado; mapas, estampas y fotografías anteriores a 1900; material audiovisual anterior a 1940; fonogramas con más de 50 años.

**Definición legal de Archivo (art. 59.1)**
"Son Archivos los conjuntos orgánicos de documentos, o la reunión de varios de ellos, reunidos por las personas jurídicas, públicas o privadas, en el ejercicio de sus actividades, al servicio de su utilización para la investigación, la cultura, la información y la gestión administrativa."

**La Junta de Calificación, Valoración y Exportación**
Órgano colegiado asesor del Ministerio de Cultura. Emite informes previos a las declaraciones de BIC para bienes muebles, controla la exportación de bienes del PHE y puede ejercer el derecho de tanteo y retracto en caso de subasta de bienes no exportables.

**Obligaciones y sanciones**
Propietarios y poseedores de bienes inventariados: conservar, mantener y custodiar; facilitar la inspección; no separar ni fragmentar; comunicar exportaciones. Infracciones: graves (destrucción, expoliación) y leves. Prescripción de infracciones: graves 5 años, leves 1 año.`,
        keywords: ['LPHE', 'Ley 16/1985', 'Patrimonio Histórico Español', 'BIC', 'Patrimonio Documental', 'Patrimonio Bibliográfico', 'art. 48', 'art. 49', 'art. 50', 'art. 59', '40 años', '100 años', 'Junta de Calificación', 'RD 111/1986'],
        laws: ['Ley 16/1985, de 25 de junio', 'LPHE art. 49', 'LPHE art. 50', 'LPHE art. 59', 'RD 111/1986'],
        dates: ['25 jun 1985 — aprobación LPHE', '40 años — antigüedad entidades privadas', '100 años — antigüedad personas físicas'],
      },
      {
        id: 'l2',
        title: 'Ley 19/2013 de Transparencia y Acceso a la Información',
        summary: 'Publicidad activa y derecho de acceso a la información pública. Límites, plazos y garantías. El Consejo de Transparencia y Buen Gobierno. Relación con los archivos.',
        content: `La Ley 19/2013, de 9 de diciembre, de transparencia, acceso a la información pública y buen gobierno (LTBG) establece el marco jurídico general del derecho de acceso a la información. Desarrolla el art. 105.b CE y complementa el RGPD en materia de datos públicos.

**Estructura de la LTBG**
- Título I: Transparencia de la actividad pública (arts. 1-24)
  - Cap. I: Ámbito subjetivo de aplicación (arts. 2-3)
  - Cap. II: Publicidad activa (arts. 5-11)
  - Cap. III: Derecho de acceso a la información pública (arts. 12-24)
- Título II: Buen gobierno (arts. 25-31)
- Título III: Consejo de Transparencia y Buen Gobierno (arts. 33-40)

**Ámbito de aplicación**
Se aplica a la AGE, CCAA, entidades locales, organismos autónomos, Banco de España, CNMV, partidos políticos, sindicatos, organizaciones empresariales y entidades privadas que reciban más del 30% de financiación pública.

**Publicidad activa (arts. 5-11)**
Las Administraciones deben publicar de oficio, de forma periódica y actualizada, la información cuyo conocimiento sea relevante para garantizar la transparencia:
- Información institucional, organizativa y de planificación (art. 6)
- Información de relevancia jurídica (art. 7): directrices, instrucciones, respuestas a consultas, etc.
- Información económica, presupuestaria y estadística (art. 8)

**Derecho de acceso a la información pública (arts. 12-24)**
Cualquier persona, a título individual o en nombre de una organización, puede solicitar acceso a la información pública sin necesidad de motivar la solicitud.

Plazo de resolución: 1 mes desde recepción de la solicitud, ampliable a otro mes más cuando la información sea de especial complejidad o volumen. El silencio es NEGATIVO.

Requisitos de la solicitud: identidad del solicitante, información que se solicita, dirección de contacto y en su caso, formato preferido.

**Límites al derecho de acceso (art. 14)**
El acceso puede ser denegado o restringido cuando suponga un perjuicio para:
1. Seguridad nacional
2. Defensa
3. Relaciones exteriores
4. Seguridad pública
5. Prevención, investigación y sanción de ilícitos penales/administrativos
6. Igualdad de las partes en procesos judiciales
7. Funciones administrativas de vigilancia, inspección y control
8. Intereses económicos y comerciales
9. Política económica y monetaria
10. Secreto profesional e intelectual
11. Garantía de la confidencialidad o el secreto en procesos de toma de decisión
12. Protección del medio ambiente

Límite especial: cuando la información contuviese datos de carácter personal: se ponderará el interés en el acceso con la protección de datos. Si los datos son especialmente protegidos (art. 7 LOPD): acceso solo con consentimiento expreso.

**El Consejo de Transparencia y Buen Gobierno**
Organismo independiente adscrito al Ministerio de Hacienda. Composición: 9 miembros (1 diputado, 1 senador, 1 del Defensor del Pueblo, 1 del TC, 1 del Tribunal de Cuentas, 1 del CGPJ, 1 de la AEPD, 1 del CES y 1 nombrado por el Gobierno). Funciones: promover la transparencia, velar por el cumplimiento, resolver reclamaciones previas al contencioso-administrativo.

**Relación con los archivos**
La LTBG refuerza la función archivística. Los archivos son los instrumentos que materializan el derecho de acceso: sin gestión documental correcta, no hay acceso efectivo. Los responsables de los archivos son actores clave en la aplicación de la ley.`,
        keywords: ['LTBG', 'Ley 19/2013', 'transparencia', 'acceso a la información', 'publicidad activa', '1 mes', 'silencio negativo', 'Consejo de Transparencia', 'límites acceso', 'protección de datos', 'art. 14 LTBG'],
        laws: ['Ley 19/2013, de 9 de diciembre', 'LTBG art. 5', 'LTBG art. 12', 'LTBG art. 14'],
        dates: ['9 dic 2013 — aprobación LTBG', '1 mes — plazo de resolución', '2 meses — plazo máximo con ampliación'],
      },
      {
        id: 'l3',
        title: 'RD 1708/2011 — Sistema Español de Archivos',
        summary: 'Estructura del Sistema Español de Archivos. El Sistema de Archivos de la AGE: archivos de gestión, centrales, AGA e históricos. El Consejo de Cooperación Archivística. La Subdirección General de Archivos Estatales.',
        content: `El Real Decreto 1708/2011, de 18 de noviembre, establece el Sistema Español de Archivos y regula el Sistema de Archivos de la Administración General del Estado y de sus Organismos Públicos y su régimen de acceso.

**El Sistema Español de Archivos**
Integra el conjunto de archivos existentes en España mediante mecanismos de cooperación. Está formado por:
- El Sistema de Archivos de la AGE y sus organismos públicos
- Los sistemas archivísticos de las CCAA
- Los sistemas archivísticos de las entidades locales
- Los archivos de otras entidades públicas y privadas que voluntariamente se adhieran

**El Consejo de Cooperación Archivística**
Órgano colegiado de cooperación entre el Estado y las CCAA en materia archivística. Composición: Presidido por el Director General de Bellas Artes (antes llamado Presidente del Consejo de Cooperación Archivística). Funciones:
- Proponer medidas para el desarrollo del Sistema Español de Archivos
- Informar sobre disposiciones normativas de carácter archivístico
- Fomentar la cooperación, comunicación e intercambio de experiencias
- Elaborar normas y criterios homologados para la gestión de archivos

**El Sistema de Archivos de la AGE**
Comprende todos los archivos de los departamentos ministeriales y organismos públicos. Se estructura en cuatro niveles funcionales:

1. Archivos de gestión u oficina: Custodian la documentación mientras está en tramitación activa o es de uso muy frecuente. Responsables: las propias unidades administrativas productoras. Transferencia al archivo central: cuando los asuntos están resueltos (generalmente 1-5 años).

2. Archivos centrales: Custodian la documentación transferida por los archivos de gestión; la consulta es menos frecuente. Dependientes de cada departamento ministerial. Transferencia al AGA: generalmente cuando la documentación tiene entre 5-15 años.

3. Archivo General de la Administración (AGA) — Alcalá de Henares: Archivo intermedio de la AGE. Creado en 1969. Recibe transferencias de los archivos centrales de los ministerios y de los organismos autónomos. Criterio de transferencia: documentación con más de 15 años de antigüedad. Custodia documentación semi-activa con plazos de conservación definitivos o pendientes de valoración.

4. Archivos históricos: Custodian la documentación con valor histórico permanente transferida desde el AGA u otros archivos. Principales: AHN, AGS, AGI, ACA, Archivo de la Real Chancillería de Valladolid, Archivo de la Real Chancillería de Granada.

**Régimen de acceso**
El RD 1708/2011 establece tres categorías de documentos según su accesibilidad:
- Documentos de libre acceso: accesibles sin restricciones
- Documentos con acceso restringido: protegidos por el período de clasificación (25, 50 años) o por afectar a datos personales, seguridad, etc.
- Documentos excluidos del acceso: mientras dure la clasificación por razones de seguridad

**La Subdirección General de los Archivos Estatales (SGAE)**
Depende de la Dirección General de Bellas Artes (Ministerio de Cultura). Competencias:
- Proponer y ejecutar la política archivística del Estado
- Gestionar directamente los Archivos Históricos Nacionales
- Coordinar el Sistema de Archivos de la AGE
- Planificar y gestionar el PARES (Portal de Archivos Españoles)
- Elaborar normas de descripción y gestión archivísticas`,
        keywords: ['RD 1708/2011', 'Sistema Español de Archivos', 'Consejo de Cooperación Archivística', 'AGA', 'archivos de gestión', 'archivos centrales', 'archivos históricos', 'SGAE', 'Alcalá de Henares', '15 años', 'régimen de acceso'],
        laws: ['RD 1708/2011, de 18 de noviembre'],
        dates: ['18 nov 2011 — aprobación RD 1708/2011', '1969 — creación AGA', '5-15 años — criterio transferencia a AGA'],
      },
      {
        id: 'l4',
        title: 'Ley 39/2015 y Ley 40/2015: Administración Electrónica',
        summary: 'Procedimiento administrativo común. El expediente y documento electrónico. Firma electrónica. Notificaciones electrónicas. El Registro Electrónico. Política de gestión de documentos electrónicos.',
        content: `Las Leyes 39/2015 y 40/2015, ambas de 1 de octubre, configuran el nuevo marco jurídico de la Administración electrónica española, con consecuencias fundamentales para la gestión documental.

**Ley 39/2015 del Procedimiento Administrativo Común (LPAC)**
Regula los requisitos de validez y eficacia de los actos administrativos, el procedimiento administrativo común y los principios a los que se ha de ajustar el ejercicio de la iniciativa legislativa y la potestad reglamentaria.

El documento administrativo electrónico (art. 26):
- Es "información de cualquier naturaleza en forma electrónica, archivada en un soporte electrónico según un formato determinado y susceptible de identificación y tratamiento diferenciado"
- Para ser válido debe: contener información con trascendencia pública; estar firmado electrónicamente (cuando así lo requiera); incorporar metadatos mínimos exigibles
- Copias electrónicas auténticas: tienen la misma validez que el documento original

El expediente administrativo electrónico (art. 70):
- "Conjunto ordenado de documentos y actuaciones que sirven de antecedente y fundamento a la resolución administrativa, así como las diligencias encaminadas a ejecutarla"
- Deberá contener: índice electrónico (firmado por la Administración), identificación, documentos, comunicaciones y notificaciones practicadas, informes y dictámenes, actos de trámite y la resolución
- El índice electrónico es FUNDAMENTAL: garantiza la integridad del expediente y permite su recuperación

**Firma electrónica**
- Firma electrónica simple: datos en formato electrónico consignados junto a otros o asociados con ellos
- Firma electrónica avanzada: vinculada de forma única al firmante, capaz de identificarle, creada con datos que el firmante puede usar con un alto nivel de confianza, ligada a los datos firmados de forma que cualquier modificación ulterior es detectable
- Firma electrónica cualificada (reconocida): firma avanzada basada en certificado cualificado y creada mediante dispositivo cualificado de creación; tiene el mismo efecto jurídico que la firma manuscrita

**Notificaciones electrónicas**
- Con carácter general, las Administraciones deben practicar las notificaciones por medios electrónicos
- Las personas jurídicas y entidades sin personalidad jurídica DEBEN relacionarse electrónicamente con la Administración
- Dirección Electrónica Habilitada única (DEH): sede electrónica oficial del Estado para notificaciones
- Sistemas de acuse de recibo: el rechazo expreso o el transcurso de 10 días sin acceder a la notificación produce los efectos del rechazo

**Ley 40/2015 del Régimen Jurídico del Sector Público (LRJSP)**
Regula la organización y funcionamiento de las AAPP. Aspectos clave para archivos:
- Art. 17: Sede electrónica: domicilio electrónico de la Administración; igual valor que sede física
- Art. 45: Transmisión de datos entre AAPP: principio de interoperabilidad; los ciudadanos no deben aportar datos ya en poder de la Administración
- Política de gestión de documentos electrónicos (art. 17.f): las AAPP deben aprobar y publicar su política de gestión de documentos, que regule el ciclo de vida de los documentos electrónicos desde su creación hasta su eliminación o conservación permanente

**Metadatos mínimos exigibles**
Según el Esquema Nacional de Interoperabilidad (ENI): identificador, órgano, fecha de captura, origen (ciudadano/administración), estado de elaboración, formato, tipo documental, tipo de firma, CSV (código seguro de verificación).`,
        keywords: ['Ley 39/2015', 'Ley 40/2015', 'documento electrónico', 'expediente electrónico', 'art. 26', 'art. 70', 'firma electrónica cualificada', 'índice electrónico', 'metadatos', 'DEH', 'ENI', 'política de gestión documental', 'notificación electrónica'],
        laws: ['Ley 39/2015, de 1 de octubre', 'Ley 40/2015, de 1 de octubre', 'Ley 39/2015 art. 26', 'Ley 39/2015 art. 70'],
        dates: ['1 oct 2015 — aprobación Leyes 39/2015 y 40/2015', '10 días — plazo acuse recibo notificación electrónica'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: HISTORIA DE LOS ARCHIVOS
  // ═══════════════════════════════════════════════════════════
  {
    id: 'historia',
    label: 'Historia de los Archivos e Instituciones',
    icon: 'History',
    color: '#7C3AED',
    bg: '#F5F3FF',
    estimatedMinutes: 110,
    topics: [
      {
        id: 'h1',
        title: 'Orígenes de los archivos: Antigüedad y Edad Media',
        summary: 'Primeros archivos en Mesopotamia y Egipto. Archivos griegos y romanos. El Tabularium. La Edad Media: archivos eclesiásticos, regios y el Archivo de la Corona de Aragón (1318).',
        content: `La historia de los archivos es paralela a la historia de la escritura. Desde las primeras civilizaciones, la necesidad de conservar documentos que acreditaran derechos, obligaciones y decisiones administrativas impulsó la creación de los primeros depósitos documentales.

**Mesopotamia (3500-500 a.C.)**
Los primeros archivos conocidos son los depósitos de tablillas cuneiformes de las ciudades-estado mesopotámicas. En Ur (Sumeria), templos y palacios conservaban registros fiscales, contratos y correspondencia. El archivo de Ebla (Siria, ca. 2400 a.C.) es uno de los más notables: más de 17.000 tablillas con documentación administrativa, económica y literaria. En Ugarit (ca. 1400-1200 a.C.) se conserva un importante archivo diplomático.

**Egipto**
Los archivos egipcios se organizaban en templos y palacio. Se usaba el papiro como soporte. Los escribas (seshu) eran los custodios. En Deir el-Medina se han encontrado extraordinarios archivos obreros del Imperio Nuevo.

**Grecia**
En Atenas, el Metroon (siglo V a.C.) en el ágora era el archivo del Estado democrático: conservaba las leyes, decretos del pueblo y los tratados. El Metroon también era el santuario de la Madre de los Dioses. Los documentos se grababan en bronce o se escribían en madera encerada y papiro. Las ciudades-estado griegas tenían sus propios sistemas de conservación de documentos públicos.

**Roma**
El Aerarium Populi Romani (Tesoro público) se encontraba en el templo de Saturno y custodiaba los documentos financieros y los bronces con leyes y tratados. El Tabularium, construido en el año 78 a.C. por el cónsul Quinto Lutacio Cátulo en el Foro Romano, fue el gran archivo del Estado romano. Sus restos físicos aún son visibles hoy. También existía el Tabularium del Palatino (archivos del Príncipe) y el Scrinium (archivos de la cancillería imperial).

**Alta Edad Media (siglos V-X)**
Con la caída del Imperio Romano de Occidente (476 d.C.) se pierden muchos archivos. La Iglesia Católica se convierte en la gran institución conservadora: archivos catedralicios (cartularios, bulas papales), archivos monásticos (copias de documentos de donación, cartularios, necrológicos). Los reinos germánicos crean chancillerías reales; los francos desarrollan el sistema carolingio de cancillería.

**Plena Edad Media (siglos XI-XIV)**
Expansión de los archivos monásticos y catedralicios. Las Cruzadas impulsan el archivo de la Orden del Temple y la Orden de Malta. En los reinos hispánicos: la Reconquista genera una producción documental enorme. Las Cancillerías Reales de Castilla, Aragón, Navarra y Portugal conservan sus fondos con creciente sistematicidad.

**El Archivo de la Corona de Aragón (1318)**
Fundado en Barcelona por Jaime II el Justo mediante ordenanza de 1318. Es considerado el primer archivo público moderno de Europa por:
- Su permanencia ininterrumpida hasta hoy
- Su organización racional desde el inicio
- La conciencia explícita de su función pública
- La regulación de acceso y custodia
Custodia documentos desde el siglo IX. Conserva más de 4.000 pergaminos de los siglos IX-X. Archivero fundacional: Ramón Savall.`,
        keywords: ['Ebla', 'Mesopotamia', 'tablillas cuneiformes', 'Metroon', 'Tabularium', '78 a.C.', 'Archivo de la Corona de Aragón', 'Jaime II', '1318', 'Barcelona', 'cartulario', 'cancillería'],
        laws: [],
        dates: ['ca. 2400 a.C. — archivo de Ebla', 'siglo V a.C. — Metroon de Atenas', '78 a.C. — Tabularium romano', '476 d.C. — caída Roma', '1318 — Archivo Corona de Aragón (Jaime II)'],
      },
      {
        id: 'h2',
        title: 'Los grandes archivos de la Monarquía Hispánica',
        summary: 'Archivo General de Simancas (1540, Carlos I). Archivo General de Indias (1785, Carlos III). Historia, fondos y funciones de los principales archivos estatales españoles: AHN, AGA, Chancillerías.',
        content: `La centralización del poder en la Monarquía Hispánica de los siglos XVI-XVIII fue el motor de los grandes archivos del Estado moderno.

**Archivo General de Simancas (AGS)**
Fundado por Carlos I (Carlos V) mediante Real Cédula de 1540 en el castillo de Simancas (Valladolid). Razón: concentrar la documentación dispersa de la Monarquía que estaba en manos de escribanos y secretarios. Felipe II lo organizó definitivamente hacia 1561, nombrando a Diego de Ayala su primer archivero profesional y encargándole la instalación del archivo según criterios sistemáticos. Es considerado el archivo más importante de la historia moderna española y uno de los más ricos del mundo: custodia la documentación del gobierno de la Monarquía Hispánica desde el siglo XV hasta el XVIII, incluyendo los fondos del Consejo de Estado, Consejo de Castilla, Hacienda, Guerra, etc. Fue declarado Archivo de la Nación en 1844.

**Archivo General de Indias (AGI)**
Creado por Real Cédula de Carlos III de 24 de mayo de 1785. Sede: la Lonja de Sevilla, construida por Juan de Herrera (arquitectura renacentista). Motivo: el ilustrado Juan Bautista Muñoz propuso concentrar en un solo depósito todos los papeles dispersos por múltiples archivos (Simancas, Contratación, Consejo de Indias...) para escribir una historia imparcial de América. Custodia unos 90 millones de páginas de documentación americana (siglos XV-XIX). Fue declarado Patrimonio de la Humanidad por la UNESCO en 1987, junto con la Catedral y el Alcázar de Sevilla. Entre sus fondos más famosos: el diario de Colón (copia), el Tratado de Tordesillas, documentación de las expediciones de conquista.

**Archivo Histórico Nacional (AHN)**
Creado por Real Decreto de 28 de marzo de 1866, en Madrid. Propósito: custodiar los fondos documentales de las instituciones suprimidas por la Desamortización de Mendizábal (1836) y la posterior: conventos, monasterios, inquisición, órdenes militares, etc. Es el archivo histórico más extenso de España. Sede actual: c/ Serrano 115, Madrid (edificio de la Biblioteca Nacional). Entre sus secciones más importantes: Clero Regular y Secular, Inquisición, Órdenes Militares, Consejos, Estado, Nobleza (sección en Toledo).

**Archivo General de la Administración (AGA)**
Creado en 1969 en Alcalá de Henares. Es el archivo intermedio de la AGE: recibe las transferencias de los archivos centrales de los ministerios cuando la documentación supera los 15 años. Actualmente custodia más de 170 km lineales de documentación, siendo uno de los archivos más extensos del mundo.

**Archivo de la Real Chancillería de Valladolid**
Fundado en 1480 con los Reyes Católicos. Custodia la documentación del principal tribunal de justicia de la Corona de Castilla (siglos XV-XIX). Especialmente importante para la historia del derecho, la genealogía y la historia social. Fondos: pleitos civiles y criminales, hidalguías, ejecutorias.

**Archivo de la Real Chancillería de Granada**
Creado en 1505 por los Reyes Católicos. Jurisdicción: territorios al sur del río Tajo. Custodia documentación similar a la de Valladolid para el ámbito meridional.

**Archivo de la Corona de Aragón (ACA)**
Ya visto en el tema anterior. Continúa en activo en Barcelona. Desde 1318 hasta hoy. Custodia fondos de la Corona de Aragón, del Principado de Cataluña, del Real Patrimonio y de la Audiencia de Cataluña.`,
        keywords: ['AGS', 'AGI', 'AHN', 'AGA', 'Carlos I', '1540', 'Simancas', 'Carlos III', '1785', 'Juan Bautista Muñoz', 'Lonja de Sevilla', 'UNESCO 1987', '1866', 'Desamortización', 'Chancillería de Valladolid', '1480', 'Alcalá de Henares'],
        laws: [],
        dates: ['1318 — ACA (Jaime II)', '1480 — Chancillería de Valladolid (RRCC)', '1505 — Chancillería de Granada', '1540 — AGS (Carlos I)', '24 may 1785 — AGI (Carlos III)', '28 mar 1866 — AHN', '1969 — AGA', '1987 — AGI Patrimonio UNESCO'],
      },
      {
        id: 'h3',
        title: 'Historia de las Instituciones Político-Administrativas',
        summary: 'Del Consejo Real a los Ministerios. Los Austrias: Consejos y Secretarías. Los Borbones: Secretarías de Estado y del Despacho. El Estado liberal: Ministerios y Administración moderna.',
        content: `El conocimiento de la historia de las instituciones es fundamental para entender la procedencia de los fondos archivísticos y aplicar correctamente el principio de procedencia.

**La Monarquía Castellana medieval**
La Curia Regia era la asamblea de nobles y eclesiásticos que asesoraba al Rey. De ella deriva el Consejo Real (siglo XIII), que se divide en el siglo XIV en el Consejo Privado y la Audiencia. Con los Reyes Católicos se consolida el sistema polisinodial (gobierno por Consejos):
- Consejo Real de Castilla (1480): máximo tribunal y órgano consultivo de la Corona de Castilla
- Consejo de Aragón (1494): para los territorios de la Corona de Aragón
- Consejo de la Suprema Inquisición (1483): el Tribunal de la Inquisición
- Consejo de Indias (1524, Carlos I): gobierno de los territorios americanos
- Consejo de Estado (1526, Carlos I): política exterior; único con competencia en todos los territorios

**Los Austrias: sistema polisinodial**
Bajo Carlos I y Felipe II el sistema alcanza su máxima complejidad. Los Consejos tenían funciones ejecutivas, legislativas, judiciales y consultivas. Cada territorio tenía su Consejo (Castilla, Aragón, Italia, Flandes, Portugal...). La cancillería real expedía los documentos en nombre del Rey.

**Los Borbones: reforma administrativa (siglo XVIII)**
Felipe V (1700-1746) introduce el modelo francés:
- Supresión progresiva de los Consejos territoriales (Aragón, Italia, Flandes, Portugal)
- Creación de las Secretarías de Estado y del Despacho (equivalentes a los Ministerios actuales)
- Las cuatro Secretarías iniciales (1705): Estado, Justicia, Guerra, Marina e Indias
- Plantas de los Ministerios: racionalización de la Administración por Felipe V y Fernando VI

**El Estado liberal: siglos XIX-XX**
Con la Constitución de Cádiz de 1812 y el triunfo del liberalismo se crean los Ministerios modernos:
- Cada Ministerio tiene su propia estructura orgánica y archivos
- Ley de Organización y Atribuciones de los Juzgados y Tribunales de 1835
- Ley Municipal de 1845; Ley Provincial de 1845
- Creación del sistema de Registro Civil (1870)
- Creación del Cuerpo Facultativo de Archiveros, Bibliotecarios y Arqueólogos (1858)
- El BOE (Gaceta de Madrid desde 1697; denominación BOE desde 1936)

**Administración contemporánea**
La Ley de Régimen Jurídico de la Administración del Estado de 1957 y la Ley de Procedimiento Administrativo de 1958 configuraron la Administración franquista. La transición democrática y la CE de 1978 transformaron radicalmente la organización: creación de las CCAA, multiplicación de las Administraciones, digitalización.`,
        keywords: ['Consejo Real', 'sistema polisinodial', 'Consejo de Indias', '1524', 'Consejo de Estado', '1526', 'Secretarías de Estado', 'Felipe V', 'Borbones', 'Ministerios', 'Cuerpo Facultativo', '1858', 'Gaceta de Madrid', 'Constitución de Cádiz', '1812'],
        laws: [],
        dates: ['1480 — Consejo Real de Castilla', '1483 — Consejo de la Inquisición', '1494 — Consejo de Aragón', '1524 — Consejo de Indias', '1526 — Consejo de Estado', '1705 — Secretarías Estado (Felipe V)', '1812 — Constitución de Cádiz', '1858 — Cuerpo Facultativo Archiveros'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: FUNDAMENTOS Y GESTIÓN DOCUMENTAL
  // ═══════════════════════════════════════════════════════════
  {
    id: 'gestion',
    label: 'Fundamentos y Gestión Documental',
    icon: 'Layers',
    color: '#0891B2',
    bg: '#ECFEFF',
    estimatedMinutes: 105,
    topics: [
      {
        id: 'g1',
        title: 'Conceptos fundamentales de Archivística',
        summary: 'Definición de Archivística, archivo y documento de archivo. El principio de procedencia y el de respeto al orden original. El ciclo vital de los documentos: Jenkinson y Schellenberg.',
        content: `La Archivística (o Archivología) es la disciplina científica que estudia los principios teóricos y los métodos prácticos para la gestión, organización y conservación de los archivos y los documentos de archivo.

**Definición de Archivo**
La Ley 16/1985 (art. 59.1): "Son Archivos los conjuntos orgánicos de documentos, o la reunión de varios de ellos, reunidos por las personas jurídicas, públicas o privadas, en el ejercicio de sus actividades, al servicio de su utilización para la investigación, la cultura, la información y la gestión administrativa."

El Diccionario de Terminología Archivística (1993) del Ministerio de Cultura define archivo como: "1. Conjunto orgánico de documentos producidos y/o recibidos en el ejercicio de sus funciones por las personas físicas o jurídicas, públicas y privadas. 2. La institución cultural donde se reúnen, conservan, ordenan y difunden para su uso los conjuntos orgánicos de documentos. 3. El local donde se conservan y consultan dichos fondos."

**El documento de archivo**
Características diferenciadoras frente a otros documentos:
- Carácter seriado: se produce de forma continuada como resultado de una actividad
- Carácter orgánico: nace vinculado a la función que lo produce (no de forma intencional)
- Autenticidad: es evidencia de una actividad o transacción real
- Unicidad: aunque existan copias, el original es único en su contexto de procedencia
- Interrelación: los documentos se relacionan entre sí formando series y fondos

**El principio de procedencia (Provenienzprinzip)**
Formulado por el archivero francés Natalis de Wailly en una circular de 24 de abril de 1841 dirigida a los departamentos del archivo histórico. Enunciado: "Los documentos de un fondo deben agruparse por su origen, procedencia o fuente productora, sin mezclarlos con los de otros fondos." Implicaciones: un fondo archivístico no puede mezclarse con otro aunque traten los mismos temas.

Desarrollo del principio:
- Holanda (1898): Müller, Feith y Fruin publican el "Manual para la ordenación y descripción de los archivos" (Manual holandés), que codifica el principio en 100 reglas.
- Alemania: lo denominan Provenienzprinzip
- Italia: Boncompagni desarrolla el Metodo storico
- España: se incorpora a través de la influencia francesa e italiana

**El principio de respeto al orden original**
Complementario al de procedencia. Dentro de cada fondo, los documentos deben conservarse en el orden en que fueron organizados por la institución productora. También llamado principio de estructura original o de respeto al orden natural.

**El ciclo vital de los documentos**
Concepto propuesto por Theodore R. Schellenberg (archivero norteamericano, Archivos Nacionales de EEUU, décadas 1940-1960) basado en la teoría biológica de la vida. Los documentos pasan por fases:

1. Fase activa (First age / Age active): nacimiento y vida activa del documento. Ubicación: archivo de gestión u oficina. Valores: administrativo, jurídico, fiscal. Consulta muy frecuente por la propia entidad productora.

2. Fase semiactiva (Second age / Age semiactive): el documento ha perdido su utilidad inmediata pero puede ser consultado ocasionalmente. Ubicación: archivo central o intermedio. Los plazos de prescripción son el criterio principal. Consulta esporádica.

3. Fase inactiva o histórica (Third age / Age definitive): el documento ha perdido toda vigencia administrativa pero tiene valor histórico, científico o cultural. Ubicación: archivo histórico. Conservación permanente o eliminación controlada.

El archivero británico Sir Hilary Jenkinson (1882-1961) formuló la teoría de la custodia ininterrumpida: la autenticidad del documento se garantiza cuando ha permanecido bajo custodia de la institución que lo produjo o sus sucesoras legales.`,
        keywords: ['Archivística', 'principio de procedencia', 'Natalis de Wailly', '24 abr 1841', 'Manual holandés', '1898', 'Müller Feith Fruin', 'ciclo vital', 'Schellenberg', 'Jenkinson', 'fase activa', 'fase semiactiva', 'archivo histórico', 'seriado', 'orgánico'],
        laws: ['LPHE art. 59'],
        dates: ['24 abr 1841 — principio de procedencia (Wailly)', '1898 — Manual holandés', '1965 — Manual Schellenberg'],
      },
      {
        id: 'g2',
        title: 'Clasificación, ordenación y cuadro de clasificación',
        summary: 'Agrupaciones documentales (fondo, sección, serie, expediente). Sistemas de clasificación: funcional, orgánico, por materias. El cuadro de clasificación. Sistemas de ordenación: cronológica, alfabética, numérica, geográfica.',
        content: `La clasificación y la ordenación son las dos operaciones intelectuales y físicas fundamentales del tratamiento archivístico. Son operaciones distintas que se realizan en fases diferentes.

**Agrupaciones documentales (de mayor a menor)**
1. Grupo de fondos: conjunto de fondos de instituciones que guardan entre sí una relación jerárquica o funcional. Ejemplo: fondos de todos los Ministerios.
2. Fondo: "conjunto orgánico de documentos producidos y/o recibidos en el ejercicio de sus funciones por una persona física, jurídica, pública o privada." Es la unidad máxima de descripción archivística.
3. Subfondo: subdivisión del fondo que corresponde a una unidad subordinada al productor del fondo.
4. Sección de fondo: división funcional del fondo que corresponde a una función, actividad o negocio principal de la institución productora.
5. Subsección: subdivisión de la sección.
6. Serie documental: "Conjunto de unidades documentales de estructura, contenido informativo o tipología semejante, que se han producido de forma continuada como resultado de una misma actividad o función." Ejemplo: serie de expedientes de personal, serie de actas de Consejo de Ministros.
7. Subserie: subdivisión de la serie.
8. Unidad documental compuesta o expediente: "Conjunto de documentos generados orgánica y funcionalmente por un sujeto productor en la resolución de un mismo asunto." El expediente es la unidad de descripción más frecuente en archivos administrativos.
9. Unidad documental simple (documento): unidad mínima de descripción e información archivística.

**La clasificación**
"Operación intelectual consistente en el establecimiento de las categorías y grupos que reflejan la estructura orgánica y/o funcional del fondo." El instrumento resultante es el CUADRO DE CLASIFICACIÓN.

Sistemas de clasificación:
- Funcional: basado en las funciones y actividades de la entidad productora (RECOMENDADO por la normativa internacional). Más estable que el orgánico porque las funciones cambian menos que la estructura.
- Orgánico: refleja la estructura jerárquica de la entidad en el momento de su creación. Problema: queda obsoleto con las reorganizaciones administrativas.
- Por materias o asuntos: agrupa los documentos por su contenido temático. DESACONSEJADO en archivos: destruye el principio de procedencia.
- Mixto orgánico-funcional: combina los dos primeros; el más usado en la práctica española.

**El cuadro de clasificación**
Instrumento técnico que refleja la estructura del fondo archivístico estableciendo las secciones, subsecciones, series y subseries. Características:
- Refleja la actividad de la institución productora
- Es flexible y actualizeable
- Debe estar aprobado por la institución productora

**La ordenación**
"Operación de disponer físicamente los documentos dentro de las series siguiendo un criterio determinado." Se realiza DENTRO de cada serie ya clasificada.

Sistemas de ordenación:
- Cronológica: por fechas (año, mes, día). Muy frecuente en series administrativas (correspondencia, actas). Variante: anticronológica (del más reciente al más antiguo).
- Alfabética: por nombres de personas, lugares o materias. Onomástica (por apellidos), topográfica (por lugares), temática (por materias).
- Numérica: por números de registro o expediente. Muy usada en expedientes de personal.
- Alfanumérica: combinación de letras y números.
- Geográfica: por provincias, municipios o divisiones administrativas.
- Por materias: dentro de una serie ya clasificada por función, se ordena por el asunto concreto.`,
        keywords: ['fondo', 'subfondo', 'sección', 'serie documental', 'expediente', 'documento', 'cuadro de clasificación', 'clasificación funcional', 'clasificación orgánica', 'ordenación cronológica', 'ordenación alfabética', 'ordenación numérica'],
        laws: [],
        dates: [],
      },
      {
        id: 'g3',
        title: 'Valoración, selección y eliminación de documentos',
        summary: 'Valores primarios y secundarios (Schellenberg). El proceso de valoración. Tablas de valoración documental. La Comisión Superior Calificadora. El muestreo archivístico.',
        content: `La valoración documental es el proceso intelectual, metodológico y sistemático mediante el cual se determina el valor de los documentos con vistas a su conservación permanente, eliminación total o conservación parcial (muestreo).

**Valores del documento (Schellenberg, Modern Archives, 1956)**

Valores primarios (interés para la institución productora):
- Valor administrativo: utilidad para las gestiones corrientes de la institución
- Valor jurídico o legal: derechos y obligaciones de naturaleza jurídica
- Valor fiscal o económico: relativo a transacciones de carácter económico o financiero
- Valor informativo en sentido amplio: información sobre personas, lugares, cosas

Valores secundarios (interés para la investigación y la cultura tras perder el valor primario):
- Valor testimonial o probatorio: refleja la organización, estructura, funciones y procedimientos de la institución (de lo que da testimonio)
- Valor informativo: información sobre personas, hechos, lugares y épocas pasadas que puede ser útil para investigadores externos

**El proceso de valoración**
1. Identificación de la serie: determinación del productor, función que la origina, contenido, legislación que la regula, volumen y soporte
2. Análisis de los valores: estudio de los valores primarios (plazos de prescripción legal, utilidad administrativa) y secundarios
3. Determinación de los plazos de conservación:
   - Plazo de conservación en archivo de gestión
   - Plazo de conservación en archivo central
   - Plazo de conservación en archivo intermedio
   - Destino final: conservación permanente / eliminación / muestreo
4. Elaboración de la propuesta de tabla de valoración
5. Dictamen de la Comisión Calificadora competente
6. Aplicación: transferencias y eliminaciones autorizadas

**La Comisión Superior Calificadora de Documentos Administrativos (CSCDA)**
Órgano colegiado adscrito al Ministerio de Cultura. Creada por RD 1401/2007.
- Estudia y dictamina sobre el valor y utilidad de los documentos
- Emite dictamen previo a cualquier eliminación de fondos documentales de la AGE
- Establece los criterios de valoración aplicables con carácter general

**Las Tablas de Valoración Documental**
Instrumentos técnicos que recogen, para cada serie documental:
- Identificación de la serie (denominación, código, productor)
- Valores del documento
- Plazos de transferencia entre tipos de archivo
- Acceso (abierto / restringido / cerrado)
- Destino final (conservación permanente / eliminación / muestreo)

**El muestreo archivístico**
Cuando una serie documental no tiene valor histórico suficiente para conservarse íntegramente, pero tampoco puede eliminarse completamente, se aplica el muestreo: conservación de una muestra representativa.
Tipos de muestreo:
- Aleatorio: selección al azar de un porcentaje (ej. 10%)
- Sistemático: selección de unidades a intervalos regulares (ej. todo enero de cada año)
- Intencional o selectivo: selección de casos representativos por su contenido excepcional
- Cronológico: conservación de los ejemplares de determinados períodos (primero y último de cada decenio)`,
        keywords: ['valoración', 'Schellenberg', 'Modern Archives 1956', 'valores primarios', 'valores secundarios', 'valor administrativo', 'valor testimonial', 'CSCDA', 'tablas de valoración', 'muestreo', 'eliminación', 'plazos de conservación', 'RD 1401/2007'],
        laws: ['RD 1401/2007'],
        dates: ['1956 — Modern Archives (Schellenberg)'],
      },
      {
        id: 'g4',
        title: 'Identificación y transferencias documentales',
        summary: 'La identificación archivística: objeto y metodología. Las transferencias: ordinarias y extraordinarias. Ingresos de documentos. El expurgo.',
        content: `**La identificación archivística**
"Fase del tratamiento archivístico que consiste en la investigación y sistematización de las categorías administrativas y archivísticas en que se sustenta la estructura de un fondo." Precede lógicamente a la valoración y la descripción.

Objeto de la identificación:
1. Identificar el organismo productor: estructura orgánica, funciones, evolución histórica, legislación reguladora, denominaciones anteriores, órganos subordinados
2. Identificar el tipo documental: denominación, análisis diplomático (caracteres externos e internos), función que lo origina, trámite administrativo, valores
3. Identificar la serie documental: delimitación, cronología, volumen, soporte, estado de conservación

**Tipos de ingresos de documentos en los archivos**
Ingresos ordinarios (transferencias reguladas):
- Transferencias internas: de un archivo de ciclo vital inferior al superior (gestión → central → intermedio → histórico)
- Depósito administrativo: documentos cedidos temporalmente por otras instituciones

Ingresos extraordinarios (no regulados):
- Donación: cesión voluntaria y gratuita por parte de un particular o institución
- Compra: adquisición mediante precio
- Legado: transmisión testamentaria
- Dación en pago: entrega de bienes culturales al Estado en pago de deudas fiscales
- Canje o intercambio: entre archivos
- Recogida de urgencia: en caso de peligro para los documentos
- Expropiación forzosa: por razones de utilidad pública
- Comiso: confiscación judicial

**Las transferencias internas**
La transferencia es la operación mediante la cual los documentos pasan de un archivo a otro del ciclo vital.

Procedimiento:
1. El archivo cedente elabora la relación de entrega (inventario de lo que transfiere)
2. El archivo receptor comprueba el estado de los documentos y su correspondencia con la relación
3. Firma del acta de entrega/recepción (en duplicado)
4. El archivo cedente conserva una copia
5. El archivo receptor incorpora los documentos a sus fondos

La relación de entrega debe incluir:
- Identificación del organismo productor
- Fechas extremas
- Número de unidades de instalación
- Metros lineales
- Descripción sumaria de las series

**El expurgo**
Operación de eliminación física de los documentos que han sido valorados y cuya eliminación ha sido autorizada por la Comisión Calificadora competente. Se destruyen por trituración, incineración o desintegración, con levantamiento de acta. El expurgo sin autorización constituye una infracción grave.`,
        keywords: ['identificación archivística', 'transferencias', 'relación de entrega', 'ingresos ordinarios', 'donación', 'legado', 'dación en pago', 'expurgo', 'trituración', 'acta de entrega'],
        laws: [],
        dates: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: DESCRIPCIÓN ARCHIVÍSTICA
  // ═══════════════════════════════════════════════════════════
  {
    id: 'descripcion',
    label: 'Descripción Archivística',
    icon: 'Search',
    color: '#DC2626',
    bg: '#FEF2F2',
    estimatedMinutes: 95,
    topics: [
      {
        id: 'd1',
        title: 'Conceptos y principios de la descripción archivística',
        summary: 'Definición y objeto de la descripción. La descripción multinivel. El principio de descripción de lo general a lo particular. Niveles de descripción y su relación con las agrupaciones documentales.',
        content: `La descripción archivística es el proceso de análisis de los documentos de archivo o de sus agrupaciones, materializado en representaciones que permiten su identificación, localización y recuperación, así como la gestión y el intercambio de información archivística.

**Objeto de la descripción**
- Identificar y explicar el contexto y el contenido de los documentos
- Promover el acceso a los fondos y documentos
- Facilitar el intercambio de información entre archivos
- Controlar los fondos

**Principios de la descripción (ISAD(G))**
1. Descripción desde lo general a lo particular: comenzar por el nivel más alto (fondo) y descender hasta los niveles más específicos
2. Información relevante para el nivel descrito: no repetir información ni incluir datos propios de otro nivel
3. Vinculación entre descripciones: cada descripción debe vincularse a la de su nivel superior
4. No redundancia de información: la información que ya consta en el nivel superior no debe repetirse en los inferiores

**Descripción multinivel**
La descripción archivística se realiza en varios niveles que corresponden a las agrupaciones documentales. Cada nivel produce un instrumento descriptivo diferente:

Nivel 1 — Fondo → Guía
Nivel 2 — Sección → Inventario (de sección)
Nivel 3 — Serie → Inventario (de serie)
Nivel 4 — Unidad documental compuesta (expediente) → Catálogo
Nivel 5 — Unidad documental simple (documento) → Catálogo (analítico)
Nivel parcial — Parte de documento → Catálogo analítico

**Instrumentos de descripción**
- Guía: descripción de carácter general del archivo o de varios archivos. Informa sobre los fondos, sus características e indica cómo consultarlos. Nivel: fondo.
- Inventario: descripción de las unidades que componen un fondo o sección, ordenadas de acuerdo con su organización. Nivel: sección/serie.
- Catálogo: descripción detallada de las unidades documentales de una serie o de los documentos de un expediente. Nivel: expediente/documento.
- Índice: instrumento auxiliar que permite el acceso a la información a través de entradas ordenadas.
- Catálogo colectivo: catálogo elaborado conjuntamente por varios archivos.
- Registros de autoridad: descripciones normalizadas de productores, funciones e instituciones (ISAAR, ISDF, ISDIAH).`,
        keywords: ['descripción archivística', 'descripción multinivel', 'ISAD(G)', 'guía', 'inventario', 'catálogo', 'índice', 'nivel de descripción', 'fondo', 'serie'],
        laws: [],
        dates: [],
      },
      {
        id: 'd2',
        title: 'ISAD(G): Norma Internacional de Descripción Archivística',
        summary: 'Historia y ediciones de ISAD(G). Las 7 áreas y 26 elementos de descripción. Elementos obligatorios. Relación con los demás estándares del ICA. Aplicación práctica.',
        content: `ISAD(G) — General International Standard Archival Description (Norma Internacional General de Descripción Archivística) es el estándar del Consejo Internacional de Archivos (ICA) para la descripción de fondos y documentos de archivo.

**Historia**
- 1990: el ICA crea la Comisión Ad Hoc sobre Normas de Descripción (CADS)
- 1994: publicación de ISAD(G), 1.ª edición (Ottawa)
- 2000: publicación de ISAD(G), 2.ª edición (Estocolmo) — actualmente vigente
- En revisión para la 3.ª edición (RiC - Records in Contexts), que integrará todos los estándares del ICA

**Las 7 áreas de descripción de ISAD(G)**
La norma establece 26 elementos organizados en 7 áreas:

1. Área de identificación (quién, qué, cuándo, cuánto):
   - 3.1.1 Código de referencia (OBLIGATORIO): código de país (ISO 3166) + código del archivo + signatura
   - 3.1.2 Título (OBLIGATORIO): nombre del fondo, sección o documento; formal o atribuido
   - 3.1.3 Fecha(s) (OBLIGATORIO): fechas extremas de la documentación; fechas de producción
   - 3.1.4 Nivel de descripción (OBLIGATORIO): fondo, serie, expediente, documento
   - 3.1.5 Volumen y soporte (OBLIGATORIO): número de unidades de instalación y/o extensión (metros lineales, nº de documentos, bytes)

2. Área de contexto:
   - 3.2.1 Nombre del productor (OBLIGATORIO): nombre de la entidad, familia o persona que produjo los documentos
   - 3.2.2 Historia institucional/Reseña biográfica: descripción de la entidad productora
   - 3.2.3 Historia archivística: custodia y propiedad anteriores; transferencias
   - 3.2.4 Forma de ingreso: fuente inmediata de adquisición o transferencia

3. Área de contenido y estructura:
   - 3.3.1 Alcance y contenido: resumen de las funciones, actividades y asuntos documentados
   - 3.3.2 Valoración, selección y eliminación: acciones de valoración realizadas
   - 3.3.3 Nuevos ingresos: previsión de futuros ingresos
   - 3.3.4 Organización: estructura interna y clasificación del fondo

4. Área de condiciones de acceso y uso:
   - 3.4.1 Condiciones de acceso: legislación aplicable; restricciones; fecha de apertura
   - 3.4.2 Condiciones de reproducción: restricciones a la copia
   - 3.4.3 Lengua/escritura de los documentos
   - 3.4.4 Características físicas y requisitos técnicos
   - 3.4.5 Instrumentos de descripción disponibles

5. Área de documentación asociada:
   - 3.5.1 Existencia y localización de los documentos originales
   - 3.5.2 Existencia y localización de copias
   - 3.5.3 Unidades de descripción relacionadas
   - 3.5.4 Nota de publicaciones

6. Área de notas:
   - 3.6.1 Notas: información no recogida en los demás elementos

7. Área de control de la descripción:
   - 3.7.1 Nota del archivero: quién y cómo redactó la descripción
   - 3.7.2 Reglas o normas: normas utilizadas en la descripción
   - 3.7.3 Fecha(s) de la descripción: cuándo se creó/revisó

**Elementos obligatorios de ISAD(G)**
Solo 5 son obligatorios: Código de referencia, Título, Fecha(s), Nivel de descripción, Volumen y soporte. Los demás son opcionales pero recomendables.`,
        keywords: ['ISAD(G)', 'ICA', '1994', '2000', '7 áreas', '26 elementos', 'código de referencia', 'título', 'fecha', 'nivel de descripción', 'volumen', 'obligatorios', 'RiC', 'Records in Contexts'],
        laws: [],
        dates: ['1994 — ISAD(G) 1.ª edición (Ottawa)', '2000 — ISAD(G) 2.ª edición (Estocolmo)'],
      },
      {
        id: 'd3',
        title: 'Normas complementarias: ISAAR, ISDF, ISDIAH y normas españolas',
        summary: 'ISAAR(CPF): registros de autoridad para productores. ISDF: descripción de funciones. ISDIAH: instituciones custodias. La CNEDA y las normas españolas. RiC como marco integrador.',
        content: `El ICA ha desarrollado una familia de normas interrelacionadas para una descripción archivística completa. Junto a ISAD(G), existen tres normas complementarias.

**ISAAR(CPF) — Norma Internacional sobre Registros de Autoridad Archivísticos relativos a Corporaciones, Personas y Familias**
- 1.ª edición: 1996; 2.ª edición: 2004
- Objeto: normalizar la descripción de las entidades (corporaciones, personas y familias) que actúan como productoras de documentos de archivo
- Permite vincular a una misma entidad productora con todos los fondos que generó, aunque estén en distintos archivos
- Estructura en 4 áreas:
  1. Área de identificación: tipo de entidad (corporación/persona/familia), forma(s) autorizada(s) del nombre, otras formas del nombre, identificadores
  2. Área de descripción: fechas de existencia, historia, lugares, estatuto jurídico, funciones y actividades, textos de referencia, organización interna
  3. Área de relaciones: relaciones con otras entidades y con los fondos
  4. Área de control: código del registro de autoridad, institución responsable, fechas de creación/revisión, normas utilizadas
- Conecta con ISAD(G): el área de contexto de ISAD(G) se desarrolla plenamente en ISAAR(CPF)

**ISDF — International Standard for Describing Functions (Norma Internacional para la Descripción de Funciones)**
- Publicada en 2007 por el ICA
- Objeto: describir las funciones de las instituciones vinculadas a la producción documental
- Estructura en 4 áreas: identificación, contexto, relaciones, control
- Permite crear un contexto funcional separado de las entidades: una misma función puede ser ejercida por distintas entidades a lo largo del tiempo

**ISDIAH — International Standard for Describing Institutions with Archival Holdings (Norma Internacional para Describir Instituciones que Custodian Fondos de Archivo)**
- Publicada en 2008 por el ICA
- Objeto: describir los archivos como instituciones custodias (no los documentos)
- Estructura en 6 áreas: identificación, contacto, descripción, acceso, servicios, control
- Permite localizar en qué archivo se encuentran determinados fondos

**RiC — Records in Contexts (Registros en Contextos)**
- Marco conceptual y norma en desarrollo por el ICA desde 2016
- Objetivo: integrar ISAD(G), ISAAR(CPF), ISDF e ISDIAH en un modelo único basado en grafos de conocimiento (Linked Data / Web Semántica)
- RiC-CM (Modelo Conceptual) v0.2: publicado en 2021
- Permitirá describir las múltiples relaciones entre documentos, productores, funciones y custodios

**Normas españolas de descripción archivística**
La Comisión de Normas Españolas de Descripción Archivística (CNEDA) elabora las normas adaptadas al contexto español:
- NEDA (Norma Española de Descripción Archivística): en proceso de elaboración, equivalente española de ISAD(G)
- Norma para la elaboración de puntos de acceso normalizados de nombres de instituciones, personas, familias, lugares y materias en el sistema de descripción archivística de los Archivos Estatales (NEPAN, 2010)

**EAD — Encoded Archival Description**
Standard de codificación XML para instrumentos de descripción archivística, mantenido por la Library of Congress y la Society of American Archivists (SAA). Permite el intercambio y publicación web de descripciones archivísticas. Versión actual: EAD3 (2015).

**PARES — Portal de Archivos Españoles**
Plataforma digital del Ministerio de Cultura que ofrece acceso libre a los fondos digitalizados de los archivos estatales españoles. Implementa las normas del ICA. URL: pares.mcu.es`,
        keywords: ['ISAAR(CPF)', '1996', '2004', 'ISDF', '2007', 'ISDIAH', '2008', 'RiC', '2016', 'CNEDA', 'NEDA', 'EAD', 'EAD3', 'PARES', 'registros de autoridad', 'Linked Data'],
        laws: [],
        dates: ['1996 — ISAAR(CPF) 1.ª edición', '2004 — ISAAR(CPF) 2.ª edición', '2007 — ISDF', '2008 — ISDIAH', '2015 — EAD3', '2016 — inicio RiC'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: NORMAS Y TIPOLOGÍA DOCUMENTAL
  // ═══════════════════════════════════════════════════════════
  {
    id: 'normas',
    label: 'Normas y Tipología Documental',
    icon: 'BookOpen',
    color: '#B45309',
    bg: '#FFFBEB',
    estimatedMinutes: 90,
    topics: [
      {
        id: 'n1',
        title: 'Diplomática y tipología documental',
        summary: 'La Diplomática como ciencia auxiliar. Caracteres externos e internos del documento. Tipología documental medieval y moderna. El documento notarial. Documentos judiciales y de gobierno.',
        content: `La Diplomática es la ciencia que estudia los documentos medievales y modernos en sus aspectos formales y jurídicos, con el fin de determinar su autenticidad y fecha, y comprender su significado. Es una ciencia auxiliar fundamental de la Archivística y de la Historia.

**Historia de la Diplomática**
- 1681: el monje benedictino Jean Mabillon publica "De Re Diplomatica", obra fundacional de la Diplomática moderna, en respuesta a las dudas planteadas por Daniel Papebroch sobre la autenticidad de los diplomas merovingios
- Siglo XVIII-XIX: desarrollo de la Diplomática académica en las escuelas de paleografía
- España: la Escuela Diplomática (fundada en 1856 en Madrid) fue la institución formadora de archiveros hasta el siglo XX

**Caracteres externos del documento**
Aspectos materiales y formales:
- Soporte: pergamino, papel, vitela, papiro, tablillas de cera, etc.
- Escritura: tipo de letra, tinta, disposición
- Signum: signo o monograma del otorgante (especialmente en documentos medievales)
- Sello: elemento de validación por excelencia en la Edad Media; tipos: pendiente (de cera, plomo, dorado), placa (pegado al documento), de caucho (moderno)
- Rúbrica, firma y rubricado: elementos de autenticación personal
- Estado de conservación

**Caracteres internos del documento**
Estructura del texto (protocolo — texto — escatocolo):

Protocolo inicial:
- Invocatio: mención simbólica de Dios (en documentos religiosos medievales)
- Intitulatio: nombre e identidad del otorgante
- Inscriptio: destinatario del documento
- Salutatio: fórmula de saludo

Texto central (corpus):
- Arenga o proemio: motivación de carácter general
- Notificatio o publicatio: anuncio público del acto jurídico
- Expositio o narratio: exposición de los antecedentes
- Dispositio: cláusula central que recoge el acto jurídico principal
- Cláusulas finales: corroborativa, conminatoria (sanciones), renunciativa, etc.

Escatocolo o protocolo final:
- Data: lugar y fecha (data tópica y crónica)
- Validatio: elementos de autenticación (firma, sello, signo del notario)
- Lista de testigos

**Tipología documental medieval española**
- Diploma real: documento expedido por la Cancillería Real; tipos: privilegio, carta, albalá
- Privilegio rodado: documento real de máxima solemnidad; firma el Rey en forma circular (rueda) con el signo real; roboración de nobles y obispos
- Carta: documento real de menor solemnidad
- Albalá: carta real cerrada, de carácter privado
- Documento notarial: escritura pública otorgada ante notario; fe pública; plena validez jurídica

**Tipología documental moderna y contemporánea**
- Documentos de la Administración del Estado: disposiciones normativas (leyes, decretos, órdenes), actos administrativos (resoluciones, acuerdos), comunicaciones (oficios, circulares, notificaciones), documentos de juicio y constancia (actas, certificados, diligencias)
- Documentos judiciales: sentencias, autos, providencias, exhortos
- Documentos notariales: escrituras públicas, testimonios, actas notariales, pólizas`,
        keywords: ['Diplomática', 'Jean Mabillon', '1681', 'De Re Diplomatica', 'Escuela Diplomática', '1856', 'protocolo', 'escatocolo', 'dispositio', 'invocatio', 'privilegio rodado', 'sello', 'signum', 'diploma real', 'albalá'],
        laws: [],
        dates: ['1681 — De Re Diplomatica (Mabillon)', '1856 — Escuela Diplomática (Madrid)'],
      },
      {
        id: 'n2',
        title: 'Paleografía y cronología',
        summary: 'La Paleografía: definición y métodos. Evolución de la escritura latina en España. Escrituras medievales: visigótica, carolina, gótica. Escrituras modernas: cortesana, procesal, humanística. Cronología: cómputos, eras y calendarios.',
        content: `La Paleografía es la ciencia que estudia la escritura antigua (formas, evolución, datación y lectura). Junto con la Diplomática, es ciencia auxiliar imprescindible para el archivero que trabaja con documentos históricos.

**Historia de la Paleografía**
- El término fue acuñado por el benedictino Bernard de Montfaucon en su obra "Palaeographia Graeca" (1708)
- En España: Terreros y Pando (1758), Merino (1780), Muñoz y Rivero (finales siglo XIX)

**Evolución de la escritura latina en la Península Ibérica**

Escritura visigótica (siglos VI-XI):
- Derivada de la escritura romana cursiva vulgar
- Exclusiva de la Península Ibérica y sus ámbitos de influencia
- Variantes: redonda (para libros), cursiva (para documentos), mixta
- Sus rasgos característicos: letras a, g, t, y las ligaduras

Escritura carolina (siglos IX-XIII):
- Reforma promovida por Carlomagno para unificar la escritura en el Imperio
- Inspirada en la escritura de los scriptoría de Corbia y Tours
- Llega a España con el Camino de Santiago y la influencia cluniacense (siglo XI)
- Sustituye a la visigótica en el siglo XII
- Clara, regular y de fácil lectura

Escrituras góticas (siglos XII-XV):
- Evolución de la carolina; más angulosa y comprimida
- Textualis (gótica libraria): para códices y documentos solemnes
- Cursiva (gótica documental): más rápida y ligada; base de las escrituras góticas cancellerescas españolas
- Semicursiva y bastarda

Escrituras de la Edad Moderna española:
- Cortesana (siglo XV): escritura gótica cursiva de los documentos de la Cancillería Real castellana
- Procesal (siglos XV-XVI): derivada de la cortesana; muy ligada y de difícil lectura; usada en documentos judiciales y notariales
- Procesal encadenada (siglos XVI-XVII): variante aún más cursiva y difícil
- Humanística (siglos XV-XVI): influencia italiana renacentista; regular y clara; base de nuestra escritura actual
- Humanística cursiva: base de la letra itálica actual

**Cronología histórica**
El archivero debe conocer los sistemas de datación históricos para fechar correctamente los documentos:

Eras y cómputos:
- Era cristiana (Anno Domini, a.d.): cómputo a partir del nacimiento de Jesucristo; establecida por Dionisio el Exiguo en el siglo VI
- Era hispánica (Era española): cómputo a partir de la supuesta paz romana de Hispania (38 a.C.); suma 38 años a la era cristiana; usada en la Península hasta el siglo XIV-XV
  - Relación: año era hispánica - 38 = año era cristiana
  - Castilla abandona la era hispánica en 1383; Aragón en 1350; Navarra en 1349; Portugal en 1422
- Era de la Hégira: cómputo islámico a partir de la hégira de Mahoma (622 d.C.); año lunar
- Anno Mundi: cómputo hebreo desde la creación del mundo

El año histórico:
- Estilo de la Natividad: el año comienza el 25 de diciembre
- Estilo de la Circuncisión: el año comienza el 1 de enero (actual)
- Estilo de la Anunciación: el año comienza el 25 de marzo
- Estilo de la Resurrección (more pisano y more florentino)`,
        keywords: ['Paleografía', 'Montfaucon', '1708', 'escritura visigótica', 'carolina', 'gótica', 'cortesana', 'procesal', 'humanística', 'era hispánica', 'Era española', '38 a.C.', 'Era de la Hégira', 'año de la Natividad', 'año de la Anunciación'],
        laws: [],
        dates: ['1708 — Palaeographia Graeca (Montfaucon)', '1383 — Castilla abandona era hispánica', '1350 — Aragón abandona era hispánica', '1349 — Navarra'],
      },
      {
        id: 'n3',
        title: 'El Esquema Nacional de Interoperabilidad (ENI) y el ENS',
        summary: 'RD 4/2010 ENI: principios e interoperabilidad. Repositorios digitales. El Esquema Nacional de Seguridad (ENS). Normas técnicas de interoperabilidad (NTI). Política de gestión de documentos electrónicos.',
        content: `**El Esquema Nacional de Interoperabilidad (ENI)**
Real Decreto 4/2010, de 8 de enero, por el que se regula el Esquema Nacional de Interoperabilidad en el ámbito de la Administración Electrónica.

Objeto: establecer los criterios y recomendaciones de seguridad, normalización y conservación de la información, de los formatos y de las aplicaciones que deben ser tenidos en cuenta por las AAPP para la toma de decisiones tecnológicas que garanticen la interoperabilidad.

Principios de interoperabilidad:
- Interoperabilidad organizativa: acuerdos entre AAPP para el intercambio de información
- Interoperabilidad semántica: significado inequívoco de la información
- Interoperabilidad técnica: compatibilidad técnica para el intercambio de datos
- Interoperabilidad temporal: conservación de la información a lo largo del tiempo

**Normas Técnicas de Interoperabilidad (NTI)**
Desarrollan aspectos concretos del ENI:
- NTI de documento electrónico: estructura, metadatos mínimos, firma
- NTI de expediente electrónico: estructura e índice del expediente electrónico
- NTI de digitalización de documentos en soporte papel: resolución, formato, metadatos
- NTI de política de gestión de documentos electrónicos: gestión del ciclo de vida
- NTI de requisitos de conexión a la Red SARA
- NTI de protocolos de intermediación de datos
- NTI de modelo de datos para el intercambio de asientos registrales (SICRES)
- NTI de relación de modelos de datos
- NTI de catálogo de estándares
- NTI de reutilización de recursos de información

**Metadatos mínimos del documento electrónico (NTI)**
- Identificador (obligatorio): código único que identifica el documento
- Órgano (obligatorio): código DIR3 del órgano que genera el documento
- Fecha de captura (obligatorio): fecha y hora de incorporación al sistema
- Origen (obligatorio): ciudadano / administración
- Estado de elaboración (obligatorio): original, copia electrónica auténtica, digitalización auténtica, otros
- Nombre del formato (obligatorio): tipo MIME
- Tipo documental (obligatorio): resolución, comunicación, solicitud, diligencia, etc.
- Tipo de firma (obligatorio): CSV, XAdES, CAdES, PAdES, etc.
- CSV (condicional): código seguro de verificación

**El Esquema Nacional de Seguridad (ENS)**
Real Decreto 3/2010, de 8 de enero (actualizado por RD 311/2022, de 3 de mayo).
Objeto: establecer la política de seguridad en la utilización de medios electrónicos. Principios básicos: seguridad integral, gestión de riesgos, prevención, reacción y recuperación, líneas de defensa, reevaluación periódica, función diferenciada.
Niveles de seguridad: BAJO, MEDIO, ALTO (según el impacto potencial de un incidente de seguridad sobre las dimensiones: disponibilidad, autenticidad, integridad, confidencialidad y trazabilidad — DAICAT).

**Política de gestión de documentos electrónicos**
Obliga a las AAPP a aprobar y publicar su política de gestión de documentos electrónicos, que debe incluir: definición del ámbito, criterios de identificación y clasificación, criterios de acceso y seguridad, criterios de conservación y eliminación, plazos de conservación, procedimientos de transferencia y eliminación.`,
        keywords: ['ENI', 'RD 4/2010', 'interoperabilidad', 'NTI', 'metadatos mínimos', 'ENS', 'RD 311/2022', 'DAICAT', 'CSV', 'XAdES', 'DIR3', 'política de gestión documental', 'Red SARA'],
        laws: ['RD 4/2010, de 8 de enero', 'RD 311/2022, de 3 de mayo'],
        dates: ['8 ene 2010 — RD 4/2010 ENI', '3 may 2022 — RD 311/2022 ENS actualizado'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: CONSERVACIÓN
  // ═══════════════════════════════════════════════════════════
  {
    id: 'conservacion',
    label: 'Conservación y Restauración',
    icon: 'Shield',
    color: '#9333EA',
    bg: '#FAF5FF',
    estimatedMinutes: 85,
    topics: [
      {
        id: 'con1',
        title: 'Soportes documentales y causas de deterioro',
        summary: 'Composición del papel, pergamino y soportes fotográficos. Causas intrínsecas y extrínsecas de deterioro. Acidez del papel, hidrólisis, oxidación. Factores ambientales: T.ª, HR, luz UV. Agentes biológicos.',
        content: `El conocimiento de los soportes documentales y sus mecanismos de deterioro es la base de la conservación preventiva.

**El papel**
Soporte más común desde el siglo XIII en España. Composición: fibras de celulosa (algodón, lino, trapo hasta el siglo XIX; pasta de madera mecánica y química desde mediados del siglo XIX). 

Causas de deterioro intrínsecas (propias del material):
- Acidez: principal enemigo del papel. La lignina presente en la pasta de madera se oxida y produce ácidos que rompen las cadenas de celulosa (hidrólisis ácida). El papel ácido se vuelve frágil y amarillento. pH ácido: < 7. Los papeles de trapo medievales son mucho más estables (pH neutro o alcalino) que los papeles de pasta de madera del siglo XX.
- Tintas: las tintas ferrogálicas (muy usadas hasta el siglo XIX) son corrosivas; producen corrosión de la tinta (foxing). Las tintas de carbono (India ink) son muy estables.
- Apresto (cola): el apresto de gelatina o almidón es sustrato nutritivo para microorganismos.

Causas de deterioro extrínsecas:
- Temperatura elevada: acelera las reacciones químicas de deterioro (regla de Van't Hoff: por cada 10°C de aumento, las reacciones se duplican)
- Humedad relativa (HR) alta: favorece la actividad de microorganismos (hongos, bacterias) y provoca combado; alta oscilación de HR provoca expansión/contracción de las fibras
- HR muy baja: fragiliza las fibras
- Luz (especialmente UV y visible de alta energía): fotodegradación; amarillamiento; decoloración de tintas y pigmentos
- Contaminantes atmosféricos: SO₂, NOₓ, ozono; reaccionan con la humedad y forman ácidos
- Polvo y suciedad: soporte para microorganismos; abrasión mecánica
- Manipulación incorrecta: desgarros, dobleces, pérdidas de soporte

**El pergamino**
Piel de animal (ovino, caprino, bovino) tratada con cal y estirada en húmedo. Muy resistente cuando está seco. Extremadamente sensible a la humedad: se comba y pierde forma (los pliegues son inducidos por HR).

**Los soportes fotográficos**
- Daguerrotipo (1839-1860): superficie de plata sobre cobre; único; muy frágil; sensible a contaminantes atmosféricos
- Negativo de colodión húmedo (1851-1880): base de vidrio; capa de colodión + haluros de plata; frágil por el soporte de vidrio
- Negativo de nitrato de celulosa (1889-1951): base plástica de nitrato; MUY PELIGROSO: inflamable a bajas temperaturas; se autodestruye; se almacena en congelación y de forma aislada
- Negativo de acetato de celulosa (1934-1970s): base "safety film"; sufre síndrome del vinagre (hidrólisis del acetato → ácido acético)
- Negativo de poliéster (PET) (desde 1955): muy estable; base actual

**Condiciones ambientales recomendadas para archivos**
- Documentos en papel: T.ª 16-19°C (±1°C), HR 45-55% (±5%)
- Pergaminos: T.ª 13-18°C, HR 45-55%
- Fotografía B/N (gelatino-bromuro): T.ª < 15°C, HR 30-40%
- Fotografía color: T.ª < 5°C (almacén frío); HR 25-35%
- Negativos de nitrato: T.ª < -10°C, aislados del resto
- Soportes magnéticos: T.ª 10-18°C, HR 30-40%`,
        keywords: ['papel', 'celulosa', 'lignina', 'acidez', 'hidrólisis ácida', 'pergamino', 'nitrato de celulosa', 'síndrome del vinagre', 'daguerrotipo', 'tintas ferrogálicas', 'temperatura', 'humedad relativa', 'luz UV', 'foxing', 'Van\'t Hoff'],
        laws: [],
        dates: ['s. XIII — papel llega a España', '1839 — daguerrotipo', '1889 — nitrato celulosa', '1934 — acetato celulosa', '1955 — poliéster'],
      },
      {
        id: 'con2',
        title: 'Conservación preventiva: condiciones ambientales e instalaciones',
        summary: 'Plan de conservación preventiva. Control ambiental: sistemas HVAC. Instalaciones: estanterías, cajas, carpetas. Planes de emergencia. Seguridad contra incendios y agua. La norma ISO 11799.',
        content: `La conservación preventiva es el conjunto de medidas y estrategias aplicadas de forma permanente con el fin de preservar el estado físico de los documentos, evitando el deterioro antes de que se produzca.

**El plan de conservación preventiva**
Documento técnico que recoge: diagnóstico del estado de conservación del fondo, identificación de riesgos, medidas correctoras y preventivas, calendario de actuaciones, recursos necesarios, evaluación periódica.

**Control ambiental**
Sistema HVAC (Heating, Ventilation and Air Conditioning): sistema de climatización que regula temperatura, humedad y pureza del aire. Elementos clave:
- Estabilidad: las oscilaciones bruscas de T.ª y HR son más dañinas que valores constantemente incorrectos
- Monitorización continua: termohigrómetros (analógicos o digitales), dataloggers (registradores de datos)
- Filtros de aire: para partículas (HEPA) y contaminantes gaseosos (carbono activado)
- Circulación del aire: mínimo renovación de 0,5-1 vol/h para evitar estratificación

**Instalaciones físicas — Estanterías**
- Material recomendado: metal pintado con pintura epoxy o acero inoxidable (no madera, que emite compuestos orgánicos volátiles — VOC)
- Estanterías compactas (móviles): maximizan el espacio hasta en un 50%
- Separación entre estanterías y paredes: mínimo 30-40 cm (para circulación de aire y acceso)
- Separación del suelo: mínimo 10 cm (para limpieza y en caso de inundación)
- Carga máxima: según especificaciones técnicas del fabricante

**Unidades de instalación**
- Cajas de cartón sin ácido (pH neutro o alcalino; reserva alcalina ≥ 2%): protegen del polvo, luz y manipulación; retardan el deterioro por acidez (tampón alcalino)
- Carpetas de cartón sin ácido o de papel sin ácido: para documentos sueltos
- Camisa de papel sin ácido: para documentos individuales
- Rollos de papel y pergamino: no doblar; enrollar sobre tubos de cartón sin ácido

**Planes de emergencia**
- Plan de Prevención y Actuación en Emergencias (PPAE)
- Identificación de los fondos prioritarios para evacuación (lista de prioridades)
- Procedimientos de respuesta: incendio, inundación, terremoto, robo, vandalismo
- Formación del personal

**Protección contra incendios**
- Sistemas de detección temprana: ionización (humo), ópticos (partículas visibles), por aspiración (VESDA: Very Early Smoke Detection Apparatus)
- Sistemas de extinción: sprinklers de agua (riesgo para el papel); gas inerte (argón, nitrógeno, FM-200); polvo CO₂ (solo para locales sin personas)
- En archivos se prefieren sistemas de gas inerte: no dañan los documentos

**Norma ISO 11799:2003**
"Information and documentation — Document storage requirements for archive and library materials." Establece las condiciones de almacenamiento para los materiales de archivo y biblioteca, incluyendo los requisitos ambientales, del edificio y del mobiliario.`,
        keywords: ['conservación preventiva', 'HVAC', 'datalogger', 'termohigrómetro', 'estanterías compactas', 'cartón sin ácido', 'cajas sin ácido', 'reserva alcalina', 'VESDA', 'gas inerte', 'ISO 11799', 'VOC', 'HEPA', 'plan de emergencia'],
        laws: ['ISO 11799:2003'],
        dates: ['2003 — ISO 11799'],
      },
      {
        id: 'con3',
        title: 'Restauración: principios y técnicas',
        summary: 'Diferencia entre conservación, restauración y preservación. Principios de la restauración: reversibilidad, mínima intervención, reconocimiento. Técnicas de restauración del papel y pergamino. Los talleres de restauración.',
        content: `**Terminología clave**
- Preservación: todas las actividades (incluyendo conservación y restauración) orientadas a mantener el acceso a los documentos, en su forma original o en otras formas
- Conservación: actividades directas sobre los documentos para ralentizar o detener su deterioro, sin alterar su apariencia
- Restauración: tratamiento activo sobre un documento deteriorado para devolverle su funcionalidad y, en lo posible, su aspecto original; siempre respetando los principios éticos

**Principios de la restauración (Carta de Venecia 1964, adaptados a archivos)**
1. Mínima intervención: solo actuar en lo estrictamente necesario; no sustituir lo que aún puede cumplir su función
2. Reversibilidad: todos los materiales y procedimientos utilizados deben ser reversibles, para que futuras generaciones puedan rehacerlos con mejores técnicas
3. Reconocimiento: lo restaurado debe poder diferenciarse del original por un ojo experto (honestidad de la intervención)
4. Respeto a la autenticidad: no añadir ni eliminar elementos que alteren la lectura histórica del documento
5. Documentación: cada intervención debe documentarse exhaustivamente (antes, durante y después)

**Fases del proceso de restauración**
1. Diagnóstico: examen del estado de conservación, identificación de deterioros, análisis de materiales originales
2. Propuesta de tratamiento: redacción del informe con las intervenciones propuestas, materiales a usar, presupuesto
3. Autorización: aprobación por el director del archivo o entidad propietaria
4. Tratamiento activo: aplicación de las técnicas acordadas
5. Documentación final: memoria de intervención con fotografías, análisis y materiales usados

**Técnicas de restauración del papel**
- Limpieza en seco: borradores de goma, bisturí, brocha suave; eliminar suciedad superficial, manchas de hongos (tras desinfección)
- Limpieza en húmedo (lavado): en agua destilada o con agentes tensoactivos neutros; elimina sales y parte de la acidez; solo para documentos sin tintas solubles al agua
- Desacidificación: neutraliza la acidez y aporta reserva alcalina; métodos: impregnación en carbonato de calcio / carbonato de magnesio (en solución acuosa o alcohólica); Wei T'o (solución de carbonato de magnesio en Freon); Bookkeeper (partículas de MgO en spray); Papersave (industrial, para fondos completos)
- Enmendado o injerto: reintegración de fibras para reparar roturas y pérdidas de soporte; materiales: papel japonés (kozo) con cola de metilcelulosa o almidón de trigo
- Consolidación: estabilización de zonas frágiles con consolidantes reversibles
- Restauración química de tintas ferrogálicas: fitorredundantes (Phytate); fitoato cálcico

**Los talleres de restauración de los Archivos Estatales**
El Ministerio de Cultura dispone de talleres de restauración en los principales archivos estatales. El trabajo se rige por criterios internacionales y toda intervención queda documentada en la ficha de restauración.`,
        keywords: ['restauración', 'conservación', 'preservación', 'mínima intervención', 'reversibilidad', 'Carta de Venecia 1964', 'desacidificación', 'Wei T\'o', 'Bookkeeper', 'papel japonés', 'kozo', 'tintas ferrogálicas', 'lavado', 'enmendado'],
        laws: [],
        dates: ['1964 — Carta de Venecia'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BLOQUE: DIGITALIZACIÓN Y PRESERVACIÓN DIGITAL
  // ═══════════════════════════════════════════════════════════
  {
    id: 'digitalizacion',
    label: 'Digitalización y Preservación Digital',
    icon: 'Monitor',
    color: '#0F766E',
    bg: '#F0FDFA',
    estimatedMinutes: 90,
    topics: [
      {
        id: 'dig1',
        title: 'Proyectos de digitalización: planificación y estándares técnicos',
        summary: 'Objetivos y fases de un proyecto de digitalización. Equipos de digitalización. Estándares de calidad: resolución (ppp), profundidad de color, formatos. Metadatos técnicos. La NTI de digitalización.',
        content: `La digitalización es el proceso de conversión de documentos analógicos (físicos) en objetos digitales mediante la captura de imagen y/o texto, asegurando la calidad suficiente para los usos previstos (conservación, acceso, investigación).

**Objetivos de la digitalización**
1. Conservación: crear copias digitales de documentos en peligro o de difícil acceso; los originales se protegen de la manipulación
2. Acceso: facilitar la consulta remota a través de internet y portales digitales
3. Difusión y puesta en valor del patrimonio documental
4. Eficiencia administrativa: documentos electrónicos más fáciles de gestionar que los físicos

**Fases de un proyecto de digitalización**
1. Selección del fondo: criterios de prioridad (valor, fragilidad, demanda de consulta, relevancia para la investigación)
2. Preparación física: revisión del estado de conservación; intervenciones previas de restauración si son necesarias; eliminación de elementos metálicos; numeración de páginas
3. Captura de imagen: selección del equipo; configuración técnica; captura según estándares
4. Control de calidad: verificación de cada imagen (nitidez, color, complitud)
5. Generación de metadatos: técnicos (del proceso de captura), administrativos (quién, cuándo, con qué) y descriptivos (identificación del documento)
6. Almacenamiento y copia de seguridad: repositorio digital; copias en varios soportes y ubicaciones
7. Acceso y difusión: publicación en portales; OAI-PMH para harvesting
8. Plan de preservación digital a largo plazo

**Equipos de digitalización**
- Escáner plano (flatbed): para documentos sueltos, fotografías; resolución óptima hasta 600-1200 ppp
- Escáner cenital (overhead / planetario): para libros y documentos encuadernados sin presión sobre el lomo; resolución hasta 400-600 ppp; preserva los originales
- Escáner de microfilme: para negativos y microfilmes; resolución 400-600 ppp
- Cámara digital de alta resolución: para objetos tridimensionales o de gran formato; flexibilidad máxima

**Estándares de calidad técnica — Resolución (ppp: puntos por pulgada / dpi: dots per inch)**
- Documentos textuales normales (A4-A3): mínimo 300 ppp para copia de acceso; 400 ppp para master de conservación
- Documentos con letra pequeña o detalles finos: 400-600 ppp
- Fotografías y dibujos: 400-600 ppp para master
- Microfilme: 400-600 ppp
- Mapas y planos (gran formato): 300-400 ppp
- Documentos gráficos de alta precisión: hasta 800-1200 ppp

Profundidad de color:
- Documentos en blanco y negro: 1 bit (bitonal) para textos limpios; 8 bits (escala de grises) para mayor calidad
- Documentos a color: 24 bits (8 bits por canal RGB)

**Formatos de archivo**
Para master de conservación (máxima calidad, sin pérdida):
- TIFF (Tagged Image File Format): estándar de facto para masters; sin compresión o con compresión LZW (sin pérdida); muy extendido
- JPEG 2000 (ISO 15444): compresión wavelet; puede ser sin pérdida (lossless) o con pérdida (lossy); incorpora metadatos; apto para master de conservación si se usa lossless

Para copia de difusión/acceso:
- JPEG: compresión con pérdida; calidad ajustable; muy compacto; adecuado para web
- PDF/A (ISO 19005): basado en PDF; estándar para preservación de documentos textuales; autónomo (embebe fuentes, imágenes, etc.); 3 variantes: PDF/A-1 (simple), PDF/A-2 (capas, JPEG2000), PDF/A-3 (archivos adjuntos)
- PNG: sin pérdida; transparencia; adecuado para documentos con fondo no blanco

**NTI de digitalización de documentos en soporte papel (Resolución de 19 de julio de 2011)**
Requisitos mínimos del ENI para la digitalización en las AAPP:
- Resolución mínima: 200 ppp para documentos puramente textuales en buen estado; 300 ppp para el resto
- Profundidad de color mínima: 1 bit para documentos sin información de color relevante; 24 bits para documentos con color
- Formato de fichero: los establecidos en el catálogo de estándares del ENI
- Metadatos mínimos (según NTI de documento electrónico)`,
        keywords: ['digitalización', 'TIFF', 'JPEG 2000', 'PDF/A', 'ppp', 'dpi', '300 ppp', '400 ppp', 'escáner cenital', 'master de conservación', 'NTI digitalización', 'OAI-PMH', 'profundidad de color', '24 bits'],
        laws: ['Resolución 19 jul 2011 NTI digitalización', 'ISO 15444 JPEG2000', 'ISO 19005 PDF/A'],
        dates: ['19 jul 2011 — NTI digitalización'],
      },
      {
        id: 'dig2',
        title: 'Preservación digital a largo plazo: OAIS, PREMIS y estrategias',
        summary: 'El problema de la obsolescencia tecnológica. El modelo OAIS (ISO 14721). PREMIS: metadatos de preservación. Estrategias de preservación: migración, emulación, encapsulamiento. Repositorios digitales de confianza.',
        content: `La preservación digital es el conjunto de actividades gestionadas para asegurar la accesibilidad a largo plazo de la información digital, afrontando los retos de la obsolescencia tecnológica y el deterioro de los soportes.

**El problema de la obsolescencia tecnológica**
La información digital depende de la tecnología para ser accesible. Tres tipos de obsolescencia:
1. Obsolescencia del soporte físico (hardware): disquetes, CDs, DAT... los reproductores desaparecen
2. Obsolescencia del formato (software): los programas que leen formatos propietarios desaparecen
3. Obsolescencia de la estructura lógica: los datos estructurados de un sistema antiguo no son legibles por sistemas nuevos

Velocidad de degradación de soportes digitales (estimaciones):
- DVD-R de calidad: 25-100 años
- CD-R: 10-50 años
- Disco duro: 3-5 años de vida operativa media
- Cinta magnética (LTO): 15-30 años
- Microfilme de calidad archivística: 500 años

**El modelo OAIS — Open Archival Information System (Sistema Abierto de Información de Archivo)**
ISO 14721:2012 (2.ª ed.), desarrollado originalmente por el CCSDS (Comité Consultivo para los Sistemas de Datos Espaciales) de la NASA.
Es un modelo conceptual (no técnico) que define la terminología, los procesos y las responsabilidades de un sistema de preservación digital.

Responsabilidades de un archivo OAIS:
1. Negociar y aceptar depósitos adecuados de productores de información
2. Obtener suficiente control sobre la información depositada
3. Determinar qué comunidades usuarias serán los destinatarios de la información
4. Asegurar que la información sea comprensible de forma independiente para las comunidades usuarias
5. Seguir políticas documentadas que hagan comprensible la información incluso sin contar con el productor original
6. Poner la información a disposición de las comunidades usuarias

Paquetes de información (IP):
- SIP (Submission Information Package — Paquete de Envío de Información): información enviada al OAIS por el productor
- AIP (Archival Information Package — Paquete de Información de Archivo): información gestionada y preservada por el OAIS
- DIP (Dissemination Information Package — Paquete de Información de Difusión): información enviada por el OAIS al usuario final

Entidades funcionales del OAIS:
1. Ingesta (Ingest): procesa los SIP y los convierte en AIP
2. Almacenamiento archivístico (Archival Storage): almacena, mantiene y recupera los AIP
3. Gestión de datos (Data Management): mantiene la información descriptiva de los AIP
4. Administración (Administration): gestiona las operaciones del OAIS
5. Planificación de la preservación (Preservation Planning): monitoriza el entorno y planifica las estrategias de preservación
6. Acceso (Access): responde a las peticiones de los usuarios proporcionando DIP

**PREMIS — PREservation Metadata Implementation Strategies**
Esquema de metadatos para la preservación digital, mantenido por la Library of Congress. Actualmente en la versión 3.0 (2015).
PREMIS describe:
- Objetos (Objects): datos digitales + representaciones + ficheros + bitstreams
- Eventos (Events): acciones que afectan a los objetos a lo largo del tiempo (ingesta, migración, comprobación de integridad, etc.)
- Agentes (Agents): personas, organizaciones o software responsables de los eventos
- Derechos (Rights): declaraciones de derechos sobre los objetos

**Estrategias de preservación digital**
1. Migración: conversión de los documentos digitales a nuevos formatos o nuevas versiones de un mismo formato cuando el original corre riesgo de obsolescencia. Tipos: migración a formatos estándar abiertos, normalización, actualización de versión, impresión en papel o microfilme. Ventaja: accesibilidad garantizada. Inconveniente: posible pérdida de información.

2. Emulación: desarrollo de software que imita el comportamiento del hardware/software original en un entorno moderno. Permite acceder a los formatos originales sin alterar los datos. Ventaja: preserva la experiencia original. Inconveniente: muy costoso técnicamente.

3. Encapsulamiento: guardar el objeto digital junto con toda la información necesaria para recrear el entorno original. Permite preservar la capacidad de acceso futuro. Usado como complemento de otras estrategias.

4. Refresco: copiar el contenido de un soporte a otro del mismo tipo antes de que el soporte original se deteriore. No resuelve la obsolescencia del formato.

**Repositorios digitales de confianza (Trusted Digital Repositories)**
El CCDS/OAIS y el RLG han definido criterios para la certificación de repositorios de confianza:
- ISO 16363:2012: Auditoría y certificación de repositorios digitales de confianza
- CoreTrustSeal: certificación internacional de repositorios digitales
- Criterios: organización, gestión de objetos digitales, infraestructura y gestión de seguridad`,
        keywords: ['OAIS', 'ISO 14721', 'SIP', 'AIP', 'DIP', 'PREMIS', 'migración', 'emulación', 'encapsulamiento', 'refresco', 'obsolescencia tecnológica', 'CoreTrustSeal', 'ISO 16363', 'Library of Congress', 'CCSDS'],
        laws: ['ISO 14721:2012', 'ISO 16363:2012'],
        dates: ['2012 — ISO 14721 2.ª edición', '2015 — PREMIS 3.0'],
      },
      {
        id: 'dig3',
        title: 'PARES, Europeana y acceso digital al patrimonio',
        summary: 'El Portal de Archivos Españoles (PARES). Europeana y la agregación de contenidos culturales. OAI-PMH. El proyecto de digitalización de los archivos estatales. Derechos de autor en la digitalización.',
        content: `**PARES — Portal de Archivos Españoles**
Plataforma digital del Ministerio de Cultura y Deporte que ofrece acceso libre y gratuito a través de internet a los fondos digitalizados de los Archivos Estatales españoles.

Objetivos:
- Facilitar el acceso remoto a los fondos de los archivos estatales
- Describir los fondos aplicando normas archivísticas internacionales (ISAD(G), ISAAR(CPF))
- Poner a disposición pública la documentación digitalizada
- Permitir el intercambio de información con otros sistemas (Europeana, MICHAEL)

Funcionalidades:
- Búsqueda simple, avanzada y browsing por árbol de fondos
- Visualización de imágenes digitalizadas (visor integrado)
- Descarga de imágenes
- Geolocalización de documentos
- Integración con Europeana mediante OAI-PMH

Archivos integrados: AGS, AGI, AHN, AGA, ACA, Archivo de Chancillería de Valladolid, Archivo de la Real Chancillería de Granada, ACDF (Archivo de la Congregación para la Doctrina de la Fe, con fondos del Tribunal de la Inquisición Española), etc.

**Europeana**
Portal cultural europeo de acceso libre y gratuito que agrega contenidos de museos, archivos, bibliotecas y colecciones audiovisuales de toda Europa. Lanzado en 2008 por la Comisión Europea. Actualmente cuenta con más de 50 millones de objetos digitales de más de 3.000 instituciones de toda Europa.

Misión: proporcionar acceso a los datos sobre los objetos culturales de las instituciones europeas y promover su reutilización.

**OAI-PMH — Open Archives Initiative Protocol for Metadata Harvesting**
Protocolo estándar para la recolección automática de metadatos entre repositorios digitales. Permite que "aggregators" (como Europeana) recojan automáticamente los metadatos de los archivos, bibliotecas y museos que actúan como "data providers". Los metadatos se intercambian en formato Dublin Core o en otros formatos.

Esquema de metadatos Dublin Core:
15 elementos básicos: title, creator, subject, description, publisher, contributor, date, type, format, identifier, source, language, relation, coverage, rights. Mantenido por la Dublin Core Metadata Initiative (DCMI).

**Derechos de autor en la digitalización**
La digitalización no crea nuevos derechos de autor sobre los documentos de dominio público, pero plantea cuestiones sobre:
- Documentos en dominio público: pueden digitalizarse y difundirse libremente
- Documentos con derechos vigentes: la digitalización requiere la autorización del titular de los derechos
- Ley de Propiedad Intelectual (RDL 1/1996): los derechos patrimoniales duran 70 años desde la muerte del autor (en España y la UE)
- Excepción para archivos y bibliotecas: pueden hacer copias digitales para conservación sin fines comerciales`,
        keywords: ['PARES', 'Europeana', '2008', 'OAI-PMH', 'Dublin Core', 'DCMI', 'derechos de autor', '70 años', 'dominio público', 'RDL 1/1996', 'OAI-PMH', 'data provider', 'aggregator'],
        laws: ['RDL 1/1996'],
        dates: ['2008 — lanzamiento Europeana'],
      },
    ],
  },
]

export default STUDY_BLOCKS

// ═══════════════════════════════════════════════════════════════════
// TEMAS ADICIONALES (extraídos del temario oficial de preparadores)
// Se inyectan automáticamente sin duplicar los existentes
// ═══════════════════════════════════════════════════════════════════

const EXTRA_TOPICS = [
  // ── CONSTITUCIÓN ──────────────────────────────────────────────
  {
    id: 'c5',
    title: 'Las Cortes Generales: Congreso, Senado y función legislativa',
    summary: 'Composición bicameral. 350 diputados. Senado como cámara territorial. Funciones legislativa, presupuestaria y de control. Procedimiento de investidura y formación del Gobierno.',
    content: `Las Cortes Generales representan al pueblo español (art. 66.1 CE) y ejercen la potestad legislativa del Estado, aprueban los Presupuestos Generales y controlan la acción del Gobierno (art. 66.2 CE).

**El Congreso de los Diputados**
Compuesto por un mínimo de 300 y máximo de 400 diputados (en la práctica, 350). Elegidos por sufragio universal, libre, igual, directo y secreto en circunscripciones provinciales mediante sistema proporcional (Ley D'Hondt). Mandato: 4 años.

Funciones exclusivas del Congreso: investidura del Presidente del Gobierno (art. 99 CE), moción de censura (art. 113 CE), cuestión de confianza (art. 112 CE), autorización del estado de alarma, excepción y sitio.

**El Senado**
Cámara de representación territorial (art. 69.1 CE). Compuesto por senadores elegidos directamente (4 por provincia peninsular, 3 por Gran Canaria, Mallorca, Tenerife, 1 por Ceuta y Melilla, etc.) y senadores designados por las CCAA (1 por comunidad + 1 más por cada millón de habitantes). Total aproximado: 265 senadores.

**El Gobierno**
Art. 97 CE: dirige la política interior y exterior, la Administración civil y militar y la defensa del Estado. Ejerce la función ejecutiva y la potestad reglamentaria.

Composición: Presidente, Vicepresidentes, Ministros y demás miembros establecidos por ley (art. 98 CE). El Consejo de Ministros es el órgano colegiado de gobierno.

**Procedimiento de investidura (art. 99 CE)**
1. El Rey propone candidato a Presidente (previa consulta con grupos parlamentarios)
2. El candidato expone su programa político ante el Congreso
3. Votación: mayoría absoluta en 1ª vuelta; mayoría simple 48h después
4. Si no hay investidura en 2 meses desde las elecciones → disolución automática de las Cámaras

**Moción de censura (art. 113 CE)**
Constructiva: debe incluir candidato alternativo. Debe ser aprobada por mayoría absoluta del Congreso. Si prospera, el candidato propuesto queda investido automáticamente.`,
    keywords: ['Cortes Generales', 'Congreso de los Diputados', '350 diputados', 'Senado', 'cámara territorial', 'Ley D\'Hondt', 'investidura', 'mayoría absoluta', 'mayoría simple', 'moción de censura constructiva', 'cuestión de confianza', 'Consejo de Ministros', 'art. 66', 'art. 69', 'art. 97', 'art. 99', 'art. 113', 'Presupuestos Generales', 'potestad legislativa', 'potestad reglamentaria'],
    laws: ['CE art. 66', 'CE art. 69', 'CE art. 97', 'CE art. 98', 'CE art. 99', 'CE art. 112', 'CE art. 113'],
    dates: [],
  },
  {
    id: 'c6',
    title: 'Organización territorial: CCAA, Estatutos y Administración Local',
    summary: 'Estado de las Autonomías. Vías del art. 143 y 151 CE. Competencias exclusivas del Estado (art. 149) y de las CCAA (art. 148). Administración Local: municipios y provincias.',
    content: `El Título VIII CE (arts. 137-158) establece la organización territorial del Estado. El art. 2 CE vincula unidad nacional con autonomía de nacionalidades y regiones.

**El Estado de las Autonomías**
España se organiza en municipios, provincias y Comunidades Autónomas (art. 137 CE). Actualmente: 17 CCAA y 2 Ciudades Autónomas (Ceuta y Melilla).

**Vías de acceso a la autonomía**
- **Vía lenta (art. 143 CE)**: iniciativa de Diputaciones o 2/3 de municipios. Competencias limitadas, ampliables tras 5 años.
- **Vía rápida (art. 151 CE)**: para territorios con referéndum histórico de autonomía o con iniciativa del 75% de municipios y referéndum positivo. Autonomía plena desde el inicio: País Vasco, Cataluña, Galicia y Andalucía.

Los Estatutos de Autonomía son la norma institucional básica de cada CCAA, aprobados como Ley Orgánica.

**Distribución de competencias**
Art. 149 CE — competencias exclusivas del Estado: defensa, relaciones exteriores, legislación mercantil/penal/laboral, marina mercante, ferrocarriles interestatales, correos, bases del régimen de las AAPP, hacienda general; **museos, bibliotecas y archivos de titularidad estatal** (art. 149.1.28).

Art. 148 CE — competencias posibles de las CCAA: urbanismo, agricultura, turismo; **museos, bibliotecas y conservatorios de interés para la Comunidad Autónoma** (art. 148.1.15).

**Administración Local**
- **Municipio**: entidad básica. Órganos: Pleno (concejales elegidos), Alcalde (elegido por el Pleno), Junta de Gobierno Local. Competencias: urbanismo, servicios sociales, tráfico, protección civil.
- **Provincia**: entidad local con personalidad jurídica. Diputación Provincial. Función: cooperación económica a municipios. Circunscripción electoral para el Congreso y el Senado.`,
    keywords: ['Estado de las Autonomías', '17 CCAA', 'art. 143 vía lenta', 'art. 151 vía rápida', 'Estatutos de Autonomía', 'Ley Orgánica', 'art. 148', 'art. 149', 'art. 149.1.28', 'competencias exclusivas Estado', 'municipio', 'provincia', 'Diputación Provincial', 'Alcalde', 'Pleno', 'museos bibliotecas archivos estatales'],
    laws: ['CE art. 2', 'CE art. 137', 'CE art. 143', 'CE art. 148', 'CE art. 149', 'CE art. 151'],
    dates: [],
  },
  {
    id: 'c7',
    title: 'Procedimiento administrativo, actos administrativos y recursos',
    summary: 'Ley 39/2015 LPACAP. Concepto y clasificación del acto administrativo. Fases del procedimiento. Silencio administrativo. Recursos de alzada, reposición y extraordinario de revisión.',
    content: `La Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas (LPACAP) regula el procedimiento administrativo. Derogó la Ley 30/1992.

**El acto administrativo**
Declaración de voluntad, juicio, conocimiento o deseo de una Administración Pública en ejercicio de potestades administrativas. Debe ser motivado (art. 35 LPACAP) cuando limite derechos, sea desfavorable o se separe del criterio de informes previos.

Elementos: subjetivos (órgano competente), objetivos (presupuesto de hecho, causa, fin) y formales (procedimiento, forma de exteriorización).

**Fases del procedimiento administrativo**
1. **Iniciación**: de oficio o a instancia de parte. Registro de la solicitud mediante registro electrónico. El órgano debe comunicar plazo máximo de resolución y efectos del silencio.
2. **Instrucción**: impulso de oficio, prueba, informes (preceptivos o facultativos, vinculantes o no). **Trámite de audiencia**: esencial, 10-15 días hábiles para que el interesado alegue.
3. **Terminación**: resolución motivada, desistimiento, renuncia, caducidad o terminación convencional. Plazo máximo general: **3 meses** (silencio positivo para procedimientos de parte, salvo excepciones).

**Silencio administrativo**
- Positivo: estimación por falta de resolución en plazo (regla general, procedimientos iniciados a instancia de parte).
- Negativo: desestimación (procedimientos de impugnación, revisión de actos, ejercicio del derecho de petición).

**Recursos administrativos**
- **Recurso de alzada** (arts. 121-122): contra actos que no agotan la vía administrativa. Plazo: **1 mes** (acto expreso) o **3 meses** (silencio). Resuelve el órgano superior jerárquico.
- **Recurso de reposición** (arts. 123-124): potestativo, contra actos que agotan la vía administrativa. Plazo: **1 mes**. Resuelve el mismo órgano.
- **Recurso extraordinario de revisión** (art. 125): contra actos firmes, supuestos tasados (error de hecho, documentos aparecidos, sentencia penal).

**Revisión de oficio** (art. 106): la Administración puede declarar nulos sus propios actos nulos de pleno derecho en cualquier momento, previa audiencia al interesado y dictamen del Consejo de Estado u órgano consultivo de la CCAA.`,
    keywords: ['Ley 39/2015', 'LPACAP', 'acto administrativo', 'motivación', 'audiencia al interesado', '10-15 días', 'silencio administrativo positivo', 'silencio negativo', '3 meses', 'recurso de alzada', '1 mes', 'recurso de reposición', 'recurso extraordinario de revisión', 'revisión de oficio', 'Consejo de Estado', 'nulidad de pleno derecho', 'caducidad', 'desistimiento'],
    laws: ['Ley 39/2015 LPACAP', 'CE art. 103', 'CE art. 9.3'],
    dates: ['2015 — Ley 39/2015 LPACAP (deroga Ley 30/1992)'],
  },
  {
    id: 'c8',
    title: 'Función pública: TREBEP, situaciones administrativas y régimen disciplinario',
    summary: 'RDL 5/2015 TREBEP. Clases de personal. Adquisición de la condición de funcionario. Situaciones administrativas. Derechos, deberes, incompatibilidades. Faltas y sanciones.',
    content: `El Real Decreto Legislativo 5/2015, de 30 de octubre, aprueba el texto refundido de la Ley del Estatuto Básico del Empleado Público (TREBEP). Es la norma básica de la función pública española.

**Clases de personal al servicio de las AAPP**
- **Funcionarios de carrera**: vinculación permanente, nombramiento legal. Ejercen funciones que implican participación en el ejercicio de potestades públicas.
- **Funcionarios interinos**: por razones de urgencia o necesidad, para plazas vacantes, sustitución, exceso de tareas.
- **Personal laboral**: vinculación contractual. Fijo, indefinido no fijo, temporal.
- **Personal eventual**: confianza o asesoramiento especial. Libre nombramiento y cese.

**Adquisición de la condición de funcionario**
Requisitos: nacionalidad española (con excepciones UE para ciertos puestos), capacidad funcional, mayoría de edad, titulación exigida, no haber sido separado del servicio por expediente disciplinario.

Proceso: convocatoria pública → oposición, concurso-oposición o concurso → nombramiento → toma de posesión. Principios constitucionales: igualdad, mérito, capacidad y publicidad (art. 103.3 CE).

**Situaciones administrativas**
- **Servicio activo**: presta servicios en la Administración de origen.
- **Servicios especiales**: cargo político, misión internacional, funciones sindicales relevantes. Computa a efectos de trienios, carrera y derechos pasivos.
- **Excedencia voluntaria**: mínimo 2 años, máximo sin límite. No devenga retribuciones.
- **Excedencia por cuidado de familiares**: hasta **3 años** por hijo (reserva del mismo puesto el primer año) o hasta **2 años** por familiar dependiente.
- **Suspensión de funciones**: sanción disciplinaria firme o prisión preventiva.

**Régimen disciplinario**
- Faltas **muy graves** (prescripción **3 años**): abandono del servicio, incumplimiento de la obligación de resolver, conductas discriminatorias, acoso laboral o sexual, condena penal firme.
- Faltas **graves** (prescripción **2 años**): incumplimiento injustificado de la jornada, falta grave de rendimiento, desobediencia.
- Faltas **leves** (prescripción **6 meses**): incorrección con ciudadanos, retraso leve.

Sanciones: separación del servicio (solo faltas muy graves) → suspensión de funciones hasta 6 años → traslado forzoso → demérito → apercibimiento.`,
    keywords: ['TREBEP', 'RDL 5/2015', 'funcionario de carrera', 'funcionario interino', 'personal laboral', 'personal eventual', 'oposición', 'concurso-oposición', 'mérito y capacidad', 'servicio activo', 'servicios especiales', 'excedencia voluntaria 2 años', 'excedencia cuidado 3 años', 'falta muy grave 3 años', 'falta grave 2 años', 'falta leve 6 meses', 'separación del servicio', 'suspensión de funciones 6 años'],
    laws: ['RDL 5/2015 TREBEP', 'CE art. 103.3', 'CE art. 149.1.18'],
    dates: ['2015 — RDL 5/2015 TREBEP'],
  },
  {
    id: 'c9',
    title: 'Igualdad de género, transparencia y Ministerio de Cultura',
    summary: 'LO 3/2007 igualdad efectiva. Plan de Igualdad: empresas >250 trabajadores. Ley 19/2013 LTAIBG: transparencia activa y pasiva. CTBG. Ministerio de Cultura RD 323/2024.',
    content: `**La Ley Orgánica 3/2007, de 22 de marzo, para la igualdad efectiva de mujeres y hombres**
Transpone la Directiva 2002/73/CE. Objetivo: hacer efectivo el principio de igualdad de trato y oportunidades. Ámbito: empleo público y privado, educación, bienes y servicios, medios de comunicación.

Medidas principales:
- **Plan de Igualdad**: obligatorio en empresas de más de **250 trabajadores** y en todas las AAPP. Incluye diagnóstico, objetivos, medidas y sistema de seguimiento y evaluación.
- **Representación equilibrada**: mínimo **40%** de cada sexo en listas electorales y órganos colegiados de selección y nombramiento.
- **Permiso de paternidad**: ampliado progresivamente hasta igualar al de maternidad (actualmente 16 semanas).
- **Comisión Interministerial de Igualdad**: coordinación de políticas entre departamentos ministeriales.

**La Ley 19/2013 de Transparencia, Acceso a la Información Pública y Buen Gobierno (LTAIBG)**
Objeto (art. 1): ampliar la transparencia, garantizar el derecho de acceso a la información pública y establecer obligaciones de buen gobierno.

Dos grandes ejes:
1. **Transparencia activa**: publicación proactiva en el Portal de Transparencia de información sobre organización, normas, contratos, subvenciones, presupuestos y retribuciones de altos cargos.
2. **Transparencia pasiva**: derecho de cualquier persona a solicitar información pública sin necesidad de justificar la petición. Plazo de respuesta: **1 mes** (prorrogable otros 30 días).

**Límites al derecho de acceso** (art. 14 LTAIBG): seguridad nacional, defensa, relaciones exteriores, seguridad pública, función inspectora, intereses económicos, propiedad intelectual, protección del medio ambiente, datos personales.

**El Consejo de Transparencia y Buen Gobierno (CTBG)**: organismo independiente adscrito al Ministerio de Hacienda. Funciones: promover la cultura de transparencia, controlar el cumplimiento de las obligaciones de publicidad activa, resolver reclamaciones.

**Ministerio de Cultura — RD 323/2024**
Estructura básica: Secretaría de Estado de Cultura → Dirección General de Bellas Artes (incluye **Subdirección General de Archivos Estatales**). Organismos autónomos: INAEM, IPCE (Instituto del Patrimonio Cultural de España).

La Subdirección General de Archivos Estatales gestiona el Sistema Español de Archivos, coordina los archivos estatales, el portal PARES y el CIDA (Centro de Información Documental de Archivos).`,
    keywords: ['LO 3/2007', 'igualdad efectiva', 'Plan de Igualdad', '250 trabajadores', '40% representación equilibrada', '16 semanas permiso paternidad', 'Ley 19/2013', 'LTAIBG', 'transparencia activa', 'Portal de Transparencia', 'transparencia pasiva', '1 mes', 'CTBG', 'Consejo de Transparencia', 'art. 14 LTAIBG', 'Ministerio de Cultura', 'RD 323/2024', 'Subdirección General de Archivos Estatales', 'CIDA', 'IPCE', 'INAEM'],
    laws: ['LO 3/2007', 'Ley 19/2013 LTAIBG', 'RD 323/2024'],
    dates: ['2007 — LO 3/2007 Igualdad', '2013 — Ley 19/2013 LTAIBG', '2024 — RD 323/2024 organización Ministerio Cultura'],
  },
  // ── LEGISLACIÓN ───────────────────────────────────────────────
  {
    id: 'l5',
    title: 'Ley 16/1985 del Patrimonio Histórico Español: Patrimonio Documental',
    summary: 'Estructura de la LPHE (9 Títulos). Patrimonio Documental: titulares, plazos de 40 y 100 años. Obligaciones de los poseedores. Junta de Calificación. RD 111/1986.',
    content: `La Ley 16/1985, de 25 de junio, del Patrimonio Histórico Español (LPHE) es la norma fundamental de protección del patrimonio cultural. Consta de 9 Títulos, 76 artículos, disposiciones adicionales, transitorias y final. Desarrollada por el RD 111/1986.

**Estructura de la LPHE**
- Título I: disposiciones generales
- Título II: Bienes de Interés Cultural (BIC)
- Título III: bienes muebles
- Título IV: Patrimonio Arqueológico
- Título V: Patrimonio Etnográfico
- Título **VI**: del Patrimonio Documental y Bibliográfico (arts. 48-53)
- Título **VII**: de los Archivos, Bibliotecas y Museos (arts. 59-66)
- Título VIII: medidas de fomento
- Título IX: infracciones y sanciones

**Patrimonio Documental (art. 49 LPHE)**
Integran el Patrimonio Documental los documentos de cualquier época generados por:
- Órganos de gobierno y Administración del Estado, CCAA y Administración Local
- Entidades y asociaciones políticas, sindicales o religiosas
- Personas privadas gestoras de servicios públicos
- Personas físicas cuya trayectoria lo justifique

Antigüedad mínima que determina automáticamente su pertenencia al Patrimonio Documental:
- Documentos generados por personas **jurídicas privadas**: **más de 40 años**
- Documentos generados por personas **físicas**: **más de 100 años**

**Obligaciones de titulares y poseedores** (art. 52 LPHE): conservar, proteger, destinar a un uso que no impida su conservación, facilitar la inspección de la Administración y el acceso de los investigadores.

**La Junta de Calificación, Valoración y Exportación de Bienes del Patrimonio Histórico**: órgano asesor del Ministerio de Cultura. Informa sobre exportación de bienes y su adquisición por el Estado. El Estado tiene derecho de tanteo y retracto en subastas de bienes del Patrimonio Documental (art. 38 LPHE).

**RD 111/1986, de 10 de enero**: desarrolla parcialmente la LPHE. Regula el Registro General de BIC, las Juntas de Calificación y los procedimientos de declaración.`,
    keywords: ['LPHE', 'Ley 16/1985', 'Patrimonio Documental', 'BIC', 'Título VI', 'Título VII', 'art. 49', '40 años personas jurídicas', '100 años personas físicas', 'Junta de Calificación', 'tanteo y retracto', 'art. 38', 'art. 52', 'obligaciones poseedores', 'RD 111/1986', 'CE art. 46', '76 artículos', '9 Títulos'],
    laws: ['Ley 16/1985 LPHE', 'RD 111/1986', 'CE art. 46'],
    dates: ['1985 — Ley 16/1985 LPHE', '1986 — RD 111/1986 desarrollo LPHE'],
  },
  {
    id: 'l6',
    title: 'RD 1708/2011: Sistema Español de Archivos y transferencias',
    summary: 'Estructura del Sistema Español de Archivos. Consejo de Cooperación Archivística: composición y funciones. Sistema de Archivos de la AGE: 4 tipos. Transferencias reglamentarias y relación de entrega.',
    content: `El Real Decreto 1708/2011, de 18 de noviembre, establece el Sistema Español de Archivos y regula el Sistema de Archivos de la Administración General del Estado y de sus Organismos Públicos. Desarrolla la Ley 16/1985 en materia archivística.

**El Sistema Español de Archivos**
Conjunto articulado de archivos, órganos y medios al servicio de la gestión documental y conservación del Patrimonio Documental. Integrado por:
- Archivos de la AGE y sus organismos públicos
- Archivos de las CCAA y Entidades Locales (por acuerdo)
- Archivos de la Iglesia Católica y otras confesiones (por acuerdo)
- Archivos de partidos políticos, sindicatos y organizaciones empresariales que reciban subvenciones públicas
- Archivos privados que formen parte del Patrimonio Documental

**El Consejo de Cooperación Archivística** (art. 12 RD 1708/2011)
Órgano colegiado de cooperación entre la AGE y las CCAA. Adscrito al Ministerio de Cultura. Funciones: coordinar el Sistema Español de Archivos, impulsar la cooperación y proponer normas y estándares.

**El Sistema de Archivos de la AGE — 4 tipos**
1. **Archivos de oficina o de gestión**: documentación en trámite o de consulta frecuente. Sin plazo fijo (aprox. 5 años).
2. **Archivos centrales**: fondos transferidos por los archivos de oficina de cada ministerio u organismo. Aprox. 5-15 años.
3. **Archivo Intermedio** (AGA — Decreto 914/1969): documentación administrativa con escasa consulta. Aprox. 15-30 años.
4. **Archivos históricos**: conservación permanente (AHN, AGS, AGI, ACA, AHP).

**Transferencias reglamentarias**
Procedimiento normalizado de traslado de documentos entre tipos de archivo. Instrumento: la **relación de entrega** (anteriormente llamada "hoja de remesa"). Debe incluir: descripción de las series, fechas extremas, número de unidades de instalación, estado de conservación, nivel de acceso.

Ciclo de transferencia tipo:
- Oficina → Archivo Central: aprox. **5 años** tras el cierre del expediente
- Archivo Central → AGA: aprox. **15 años**
- AGA → Archivo Histórico: aprox. **30 años**`,
    keywords: ['RD 1708/2011', 'Sistema Español de Archivos', 'Consejo de Cooperación Archivística', 'archivo de oficina', 'archivo central', 'archivo intermedio', 'AGA', 'archivo histórico', 'transferencia reglamentaria', 'relación de entrega', 'hoja de remesa', '5 años', '15 años', '30 años', 'Decreto 914/1969', 'ciclo vital', 'Patrimonio Documental'],
    laws: ['RD 1708/2011', 'Ley 16/1985 LPHE', 'Decreto 914/1969'],
    dates: ['1969 — Decreto 914/1969 crea el AGA', '2011 — RD 1708/2011 Sistema Español de Archivos'],
  },
  // ── HISTORIA ──────────────────────────────────────────────────
  {
    id: 'h4',
    title: 'ACA y Archivo de la Real Chancillería de Valladolid',
    summary: 'Archivo de la Corona de Aragón: fundación 1318 por Jaime II. Pedro el Ceremonioso. Fondos: Real Cancillería, Real Patrimonio, Consejo de Aragón. Chancillería de Valladolid: Enrique II (1371), Registro de Ejecutorias.',
    content: `**Archivo de la Corona de Aragón (ACA)**
Fundado en **1318** por el rey **Jaime II**, quien destinó dos cámaras del Palacio Real de Barcelona al depósito de la documentación de la Casa Real y los archivos incautados a los Templarios. Jaime II instituyó la copia íntegra de los documentos expedidos por la Cancillería en series de registros, y cuidó el ingreso de toda la documentación de su Casa Real.

Con **Pedro el Ceremonioso** (siglo XIV) el archivo se transforma progresivamente en archivo de la Administración Real.

Según Jaime Riera i Sans, el archivo pasa por etapas: archivo público → archivo cerrado → archivo de investigación.

Sede actual: **Palau dels Lloctinents**, Barcelona (desde 1856; el archivo está en el Palacio Real Mayor desde 1770).

**Fondos principales del ACA:**
- Real Cancillería: registros desde el siglo XIII (la serie más voluminosa). Registros de Cancillería son la fuente primaria para la historia medieval de la Corona de Aragón.
- Real Patrimonio: administración económica de la Corona
- Consejo de Aragón: organismo de gobierno de la Corona de Aragón (siglos XVI-XVIII)
- Generalitat de Catalunya: fondos medievales y modernos
- Órdenes militares: documentación de las Órdenes en los territorios de la Corona

**Archivo de la Real Chancillería de Valladolid**
La Chancillería de Valladolid fue creada definitivamente en **1371** por **Enrique II** como tribunal superior de justicia de Castilla. Suprimida en **1834**. El archivo recoge su documentación judicial.

Fondos principales:
- **Registro de ejecutorias**: resoluciones y sentencias del tribunal. La serie más consultada, esencial para la historia jurídica y social de Castilla.
- Pleitos civiles y criminales
- Pergaminos reales: privilegios rodados y cartas reales
- **Sala de Hijosdalgo**: expedientes de hidalguía y pruebas de nobleza
- Planos y mapas históricos de Castilla`,
    keywords: ['ACA', 'Archivo Corona de Aragón', 'Jaime II', '1318', 'Pedro el Ceremonioso', 'Palau dels Lloctinents', 'Real Cancillería', 'Registros de Cancillería', 'Real Patrimonio', 'Consejo de Aragón', 'Chancillería Valladolid', 'Enrique II', '1371', '1834', 'Registro de ejecutorias', 'Sala de Hijosdalgo', 'pruebas de hidalguía'],
    laws: [],
    dates: ['1318 — fundación ACA por Jaime II', '1371 — Chancillería de Valladolid por Enrique II', '1770 — ACA en Palacio Real Mayor', '1834 — supresión Chancillería de Valladolid', '1856 — ACA en Palau dels Lloctinents'],
  },
  {
    id: 'h5',
    title: 'AHN, Archivo de la Nobleza, AGA y archivos del siglo XX',
    summary: 'AHN (1866): desamortización, fondos de Clero, Órdenes Militares, Inquisición. Archivo Histórico de la Nobleza (Toledo, 1993). AGA (1969, Alcalá de Henares). CDMH/Archivo Guerra Civil. Archivos Históricos Provinciales.',
    content: `**Archivo Histórico Nacional (AHN)**
Creado por Real Decreto de **28 de marzo de 1866** como consecuencia directa de los procesos desamortizadores del siglo XIX (Desamortización de Mendizábal 1836-37 y Madoz 1855). La disolución de las órdenes religiosas generó un enorme volumen documental que el Estado asumió.

Sede actual: calle Serrano, Madrid (desde los años 50). Antes, en la Biblioteca Nacional.

**Fondos principales del AHN:**
- **Clero**: documentación de monasterios y conventos desamortizados. La serie más voluminosa del AHN.
- **Órdenes Militares**: Santiago, Calatrava, Alcántara y Montesa. Incluye expedientes de pruebas de nobleza para el ingreso en las órdenes.
- **Consejos Suprimidos**: Consejo de Castilla, Inquisición, Hacienda, Guerra, etc.
- **Inquisición**: fondo de proyección internacional con procesos del Tribunal del Santo Oficio.
- **Ultramar**: administración colonial americana y filipina.
- **Estado**: relaciones exteriores desde el siglo XV.

**Archivo Histórico de la Nobleza**
Creado en **1993**, sede en **Toledo** (Palacio Fuensalida). Reúne en depósito voluntario los archivos de la grandeza y nobleza española. Fondos: Casa de Osuna, Casa de Alba, Frías, Bornos y muchos otros.

**Archivo General de la Administración (AGA)**
Creado por **Decreto 914/1969**, sede en **Alcalá de Henares**. Archivo intermedio de la AGE. Heredero del Archivo General Central (destruido en el incendio de **1939**). Conserva documentación ministerial desde el siglo XIX hasta los años 80-90.

**Centro Documental de la Memoria Histórica (CDMH)**
Creado por **RD 426/1999**, sede en **Salamanca**. Reúne documentación del bando nacional de la Guerra Civil (incautaciones de la DNAE y OIPA). Actualizado por la **Ley 52/2007** de Memoria Histórica.

**Archivos Históricos Provinciales (AHP)**
Red de 52 archivos (uno por provincia). Creados desde **1931**. Custodian principalmente protocolos notariales, registros históricos y fondos de la Administración periférica del Estado.`,
    keywords: ['AHN', '1866', 'desamortización', 'Mendizábal', 'Clero', 'Órdenes Militares', 'Santiago Calatrava Alcántara Montesa', 'Inquisición', 'Consejos Suprimidos', 'Ultramar', 'Archivo Histórico de la Nobleza', 'Toledo', '1993', 'Casa de Osuna', 'AGA', 'Decreto 914/1969', 'Alcalá de Henares', '1939 incendio', 'CDMH', 'RD 426/1999', 'Salamanca', 'Ley 52/2007', 'Archivos Históricos Provinciales', '1931', 'protocolos notariales'],
    laws: ['RD 28 marzo 1866', 'Decreto 914/1969', 'RD 426/1999', 'Ley 52/2007'],
    dates: ['1836-37 — Desamortización Mendizábal', '1866 — creación AHN', '1939 — incendio Archivo General Central', '1969 — creación AGA', '1993 — creación Archivo de la Nobleza', '1999 — RD 426/1999 CDMH', '2007 — Ley 52/2007 Memoria Histórica'],
  },
  {
    id: 'h6',
    title: 'AGS, AGI y sistema archivístico de Defensa',
    summary: 'AGS: Carlos I en 1540, Felipe II y Juan de Herrera 1572. Instrucción de 1588: primer reglamento de archivos del mundo. AGI: Carlos III en 1785, Casa Lonja Sevilla, Patrimonio UNESCO 1987. Archivos militares.',
    content: `**Archivo General de Simancas (AGS)**
En **1540**, **Carlos I** decide utilizar el Castillo de Simancas (requisado a los Enríquez) para concentrar documentación en desuso. El verdadero artífice del archivo fue **Felipe II**, quien encargó en **1572** la reforma del castillo a su arquitecto **Juan de Herrera**, con el objeto de guardar la documentación de la Corona y el Real Patrimonio.

En **1588**, Felipe II publica una **Instrucción** que ordena la transferencia periódica de documentos de los órganos de gobierno al archivo: considerado el **primer reglamento de archivos del mundo**. Este sistema se mantuvo hasta mediados del siglo XIX.

Sede: Castillo de Simancas, Valladolid. Dependiente del Ministerio de Cultura.

Fondos: documentación de la monarquía hispánica (siglos XV-XIX). Secretarías de Estado, Guerra, Hacienda, Patronato Real, Consejo de Estado, relaciones con el Papado.

**Archivo General de Indias (AGI)**
Creado en **1785** por Real Cédula de **Carlos III**, con sede en la **Casa Lonja de Sevilla** (obra de Juan de Herrera). Objetivo: centralizar la documentación dispersa sobre la administración de las Indias que estaba repartida entre Simancas, la Casa de la Contratación y el Consejo de Indias en Madrid.

Declarado **Patrimonio de la Humanidad** por la UNESCO en **1987** (junto con el Centro Histórico de Sevilla y la Catedral).

Fondos: administración colonial americana y filipina (siglos XV-XIX). Secciones: Patronato (descubrimiento y conquista), Contratación, Indiferente General, Audiencias (por territorios americanos), Consulados, Estado, Mapas y Planos.

**Sistema Archivístico de la Defensa**
Archivos principales:
- **Archivo General Militar de Segovia**: Ejército de Tierra, siglo XVIII en adelante. Expedientes personales de militares.
- **Archivo General Militar de Madrid** (Alcalá de Henares): fondos siglos XIX-XX.
- **Archivo General Militar de Ávila**: documentación de la Guerra Civil (bando nacional).
- **Archivo General de la Marina "Álvaro de Bazán"** (El Viso del Marqués, Ciudad Real): fondos de la Armada desde el siglo XVI.
- **Archivo General del Aire** (Villaviciosa de Odón, Madrid): Ejército del Aire.`,
    keywords: ['AGS', 'Simancas', 'Carlos I', '1540', 'Felipe II', 'Juan de Herrera', '1572', 'Instrucción 1588', 'primer reglamento de archivos', 'AGI', 'Archivo General de Indias', 'Carlos III', '1785', 'Casa Lonja Sevilla', 'Patrimonio de la Humanidad', '1987', 'UNESCO', 'Patronato', 'Contratación', 'Defensa', 'Álvaro de Bazán', 'El Viso del Marqués', 'Segovia'],
    laws: ['Real Cédula 1785 Carlos III', 'Instrucción 1588 Felipe II'],
    dates: ['1540 — Carlos I en Simancas', '1572 — Felipe II reforma castillo (Juan de Herrera)', '1588 — Instrucción Felipe II (primer reglamento de archivos)', '1785 — creación AGI por Carlos III', '1987 — AGI Patrimonio de la Humanidad UNESCO'],
  },
  // ── GESTIÓN ───────────────────────────────────────────────────
  {
    id: 'g5',
    title: 'Ingresos, transferencias y préstamos de documentos',
    summary: 'Sistemas ordinarios (transferencias) y extraordinarios (donación, depósito, compra) de ingreso. Procedimiento de transferencia y relación de entrega. Salidas: préstamos y reproducciones.',
    content: `Los documentos ingresan en los archivos mediante sistemas **ordinarios** (transferencias) y **extraordinarios** (donación, compra, depósito, etc.).

**Ingresos ordinarios: las transferencias**
La transferencia es el sistema reglamentario de traspaso de documentos entre tipos de archivo del mismo sistema.

- **Transferencia ordinaria**: periódica y reglamentada según los plazos del ciclo vital.
- **Transferencia extraordinaria**: fuera del calendario habitual, por saturación, cierre de oficina o reorganización.

**Procedimiento de transferencia**
1. Identificación y ordenación en la oficina cedente
2. Elaboración de la **relación de entrega** (antes llamada "hoja de remesa"): series documentales, fechas extremas, número de cajas/legajos, estado de conservación, nivel de acceso
3. Revisión y conformidad del archivo receptor
4. El archivo asigna signatura definitiva
5. La oficina cedente conserva copia de la relación

**Ingresos extraordinarios**
- **Donación**: transmisión gratuita. Requiere escritura pública o documento equivalente.
- **Legado**: por disposición testamentaria.
- **Compra o adquisición**: el Estado ejerce derecho de **tanteo y retracto** en subastas de bienes del Patrimonio Documental (art. 38 LPHE).
- **Depósito**: custodia temporal sin transmisión de propiedad. El depositante puede recuperar los documentos.
- **Incautación**: medida excepcional cuando peligra la conservación del Patrimonio Documental.

**Salidas de documentos**
- **Préstamo interarchivístico**: salida temporal para exposiciones, consultas en otro archivo o procesos judiciales. Requiere acuerdo entre archivos, seguro y control de plazos.
- **Reproducciones**: no implican salida del original. Se generan copias para el solicitante.
- **Devoluciones**: retorno de fondos al archivo custodio legítimo.`,
    keywords: ['transferencia ordinaria', 'transferencia extraordinaria', 'relación de entrega', 'hoja de remesa', 'donación', 'legado', 'compra', 'depósito', 'incautación', 'tanteo y retracto', 'art. 38 LPHE', 'préstamo interarchivístico', 'ciclo vital', 'ingresos ordinarios', 'ingresos extraordinarios', 'escritura pública'],
    laws: ['Ley 16/1985 art. 38', 'RD 1708/2011'],
    dates: [],
  },
  {
    id: 'g6',
    title: 'Ordenación documental e instalación física',
    summary: 'Concepto de ordenación vs. clasificación. Sistemas: cronológico, alfabético (onomástico, geográfico), numérico, alfanumérico. Principio de orden originario. Instalación: unidades, signaturas, topográfico.',
    content: `La ordenación es la operación de relacionar entre sí los elementos de una serie o expediente de acuerdo con un criterio establecido. Es posterior e independiente de la clasificación: la clasificación es intelectual (determina a qué serie pertenece un documento); la ordenación es física e intelectual (determina el lugar que ocupa dentro de esa serie).

**Sistemas de ordenación**

**Cronológica**: por fecha del documento (año → mes → día). La más habitual en series con actividad continua: correspondencia, actas, expedientes de procedimientos.

**Alfabética**: por la letra inicial del elemento de referencia. Variantes:
- Onomástica: por apellidos y nombre. Usada en expedientes personales.
- Geográfica: por topónimos.
- Por materias o conceptos.

**Numérica**: por número correlativo. Ágil para localización si se dispone de índice o base de datos. Usada en expedientes con numeración propia (contratos, patentes, registros).

**Alfanumérica**: combinación de letras y números. Habitual en signaturas de archivo (leg. A-234 / carp. 3).

**Principio del orden originario**
Una vez los documentos ingresan en un archivo central, intermedio o histórico, debe respetarse el orden dado por el organismo productor. Si ese orden se ha perdido, se intenta reconstruir mediante estudio previo (análisis de inventarios, registros, etc.).

**Instalación física**
Colocar las unidades de instalación en el depósito de forma ordenada y con control topográfico.

Unidades de instalación:
- **Caja de archivo**: la más común para papel. Cartón neutro libre de ácido (pH ≥ 8).
- **Legajo**: conjunto de documentos unidos por una cubierta. Uso en archivos históricos.
- **Carpeta**: subdivisión dentro de caja o legajo.
- **Planero**: para cartografía y documentos de gran formato.
- **Rollo de microfilm**.

**Signatura**: código alfanumérico único que identifica la ubicación física de cada unidad de instalación. Compuesta de: código de archivo + código de fondo/sección + número correlativo.

**Topográfico**: instrumento que relaciona la signatura con la ubicación exacta en el depósito (número de cuerpo, estante, balda).`,
    keywords: ['ordenación', 'clasificación', 'ordenación cronológica', 'ordenación alfabética onomástica', 'ordenación geográfica', 'ordenación numérica', 'ordenación alfanumérica', 'orden originario', 'instalación', 'unidades de instalación', 'caja de archivo', 'cartón neutro pH≥8', 'legajo', 'planero', 'signatura', 'topográfico'],
    laws: [],
    dates: [],
  },
  // ── DESCRIPCIÓN ───────────────────────────────────────────────
  {
    id: 'd4',
    title: 'Agrupaciones documentales: fondo, sección, serie y unidad documental',
    summary: 'Jerarquía archivística: grupo de fondos → fondo → subfondo → sección → serie → expediente → documento simple. Correspondencia con los 6 niveles ISAD(G). Principio de procedencia.',
    content: `Las agrupaciones documentales son los conjuntos de documentos que, por su origen o función, constituyen unidades diferenciadas dentro del archivo. Se organizan jerárquicamente de mayor a menor, en una estructura que reflejan los niveles de descripción.

**Jerarquía de agrupaciones (de mayor a menor)**

**Grupo de fondos**: conjunto de fondos de instituciones con vínculos históricos, territoriales o funcionales. Uso opcional; no siempre se aplica.

**Fondo**: conjunto orgánico de documentos producidos o recibidos en el ejercicio de sus actividades por una persona física o jurídica (productor). El fondo es la **unidad básica de la archivística**. El principio de procedencia exige que los documentos de distintos fondos no se mezclen.

**Subfondo**: subdivisión del fondo correspondiente a subdivisiones administrativas del productor con cierta autonomía funcional.

**Sección de fondo**: división funcional del fondo basada en las competencias o actividades del productor.

**Serie documental**: conjunto de documentos producidos de forma continuada en el ejercicio de una misma función, con la misma tipología documental. Ejemplos: "Expedientes de personal", "Actas de Junta de Gobierno", "Correspondencia oficial saliente".

**Unidad archivística compuesta — Expediente**: conjunto de documentos relacionados por tramitación del mismo asunto o procedimiento. Unidad mínima de gestión archivística práctica.

**Unidad documental simple**: el documento individual (acta, carta, decreto, plano, fotografía). La unidad mínima indivisible de la descripción archivística.

**Correspondencia con ISAD(G)**
La norma ISAD(G) establece **6 niveles de descripción**:
1. Fondo
2. Subfondo
3. Sección
4. Serie
5. Unidad documental compuesta (expediente)
6. Unidad documental simple

La descripción multinivel parte siempre del nivel superior al inferior, sin saltar niveles. La información del nivel superior no se repite en los niveles inferiores (herencia contextual).`,
    keywords: ['grupo de fondos', 'fondo', 'subfondo', 'sección de fondo', 'serie documental', 'expediente', 'unidad documental simple', 'principio de procedencia', 'unidad archivística compuesta', 'ISAD(G) 6 niveles', 'descripción multinivel', 'productor', 'herencia contextual'],
    laws: [],
    dates: [],
  },
  {
    id: 'd5',
    title: 'Instrumentos de descripción: guía, inventario, catálogo e índice',
    summary: 'Definición y tipos. Guía: visión de conjunto. Inventario somero y analítico. Catálogo: nivel de documento simple. Índices auxiliares. EAD y bases de datos. Correspondencia con niveles ISAD(G).',
    content: `Los instrumentos de descripción son los documentos de trabajo producidos por el archivo para facilitar el acceso a los fondos. Se organizan según el nivel de descripción y la profundidad del análisis.

**La Guía**
Proporciona una visión de conjunto del archivo o de un fondo. Nivel de descripción: fondo / grupo de fondos. Contenido: historia del archivo, historia institucional del productor, descripción somera de fondos, condiciones de acceso y servicios.

**El Inventario**
Describe las series de un fondo o las unidades de instalación de una serie. Dos modalidades:
- **Inventario somero**: descripción mínima por unidades de instalación (caja, legajo). Datos esenciales: signatura, serie, fechas extremas, contenido resumido.
- **Inventario analítico**: descripción de cada unidad archivística compuesta (expediente). Mayor detalle; requiere más recursos.

El inventario es el instrumento de descripción por excelencia de los archivos españoles.

**El Catálogo**
Describe individualizadamente cada unidad documental **simple** (el documento). El nivel de análisis más profundo y costoso. Se reserva para documentos de especial valor: incunables, pergaminos medievales, cartografía histórica, fotografías singulares.

**El Índice**
Instrumento auxiliar de localización rápida. Tipos: onomástico (personas), geográfico (lugares), cronológico, de materias. Acompaña a guías, inventarios o catálogos.

**Otros instrumentos**
- **Registro de transferencias / de ingresos**: control de las entradas de fondos.
- **Registro de préstamos**: control de salidas de documentos.

**Modernamente: bases de datos y EAD**
Las bases de datos relacionales han sustituido a los instrumentos en papel. El estándar internacional para codificación de instrumentos de descripción en formato digital es **EAD** (Encoded Archival Description), basado en **XML**. Permite publicación en línea e interoperabilidad entre sistemas. PARES utiliza EAD para sus descripciones.`,
    keywords: ['guía de archivos', 'inventario somero', 'inventario analítico', 'catálogo', 'índice onomástico', 'índice geográfico', 'instrumento de descripción', 'EAD', 'Encoded Archival Description', 'XML', 'PARES', 'unidad de instalación', 'registro de transferencias', 'registro de préstamos', 'nivel de descripción'],
    laws: [],
    dates: [],
  },
  // ── NORMAS ────────────────────────────────────────────────────
  {
    id: 'n4',
    title: 'Normas internacionales: ISAD(G), ISAAR(CPF), ISDF, ISDIAH y RiC',
    summary: 'Familia de normas del ICA. ISAD(G): 7 áreas y 26 elementos, 6 obligatorios. ISAAR(CPF): registros de autoridad de productores. ISDF: funciones. ISDIAH: instituciones custodias. RiC (2021): ontología integradora.',
    content: `El Consejo Internacional de Archivos (CIA/ICA) ha desarrollado una familia de 4 normas de descripción archivística, unificadas en 2021 en el modelo conceptual RiC.

**ISAD(G) — 2ª edición (2000)**
Norma general de descripción archivística multinivel. Estructura en **7 áreas** y **26 elementos**:

1. **Área de identificación**: código de referencia, título, fecha(s), nivel de descripción, volumen y soporte de la unidad
2. **Área de contexto**: nombre del productor, historia institucional/biográfica, historia archivística, forma de ingreso
3. **Área de contenido y estructura**: alcance y contenido, valoración/selección/eliminación, nuevos ingresos, sistema de organización
4. **Área de condiciones de acceso y uso**: condiciones de acceso, reproducción, lengua/escritura, características físicas, instrumentos de descripción
5. **Área de documentación asociada**: existencia/localización de originales y copias, documentación relacionada, notas de publicación
6. **Área de notas**: notas del archivero
7. **Área de control de la descripción**: reglas/convenciones utilizadas, fecha(s) de las descripciones

**Elementos obligatorios de ISAD(G)** (6): código de referencia, título, productor, fecha(s), nivel de descripción, volumen y soporte.

**ISAAR(CPF) — 2ª edición (2004)**
Norma para describir los productores de documentos: entidades colectivas (Corporate bodies), personas (Persons) y familias (Families). Genera registros de autoridad vinculables a múltiples descripciones de fondos. 4 áreas: identificación, descripción, relaciones, control.

**ISDF — 2007**
Norma para describir las funciones de las entidades que producen documentos. Permite vincular funciones con fondos y con productores.

**ISDIAH — 2008**
Norma para describir las instituciones que custodian fondos archivísticos. 6 áreas: identificación, contacto, descripción, acceso, servicios, control.

**RiC — Records in Contexts (ICA, 2021)**
Modelo conceptual (ontología) que unifica y sustituye las 4 normas anteriores. Basado en Linked Data y web semántica. Permite representar relaciones complejas entre documentos, productores, funciones y contextos a lo largo del tiempo. Consta de un modelo conceptual (RiC-CM) y una ontología OWL (RiC-O).`,
    keywords: ['ISAD(G)', '2ª edición 2000', '7 áreas', '26 elementos', '6 elementos obligatorios', 'código de referencia', 'nivel de descripción', 'ISAAR(CPF)', '2ª edición 2004', 'registro de autoridad', 'entidades colectivas', 'ISDF 2007', 'ISDIAH 2008', 'RiC 2021', 'Records in Contexts', 'ICA', 'Linked Data', 'ontología OWL', 'RiC-CM', 'RiC-O', 'descripción multinivel'],
    laws: [],
    dates: ['2000 — ISAD(G) 2ª edición', '2004 — ISAAR(CPF) 2ª edición', '2007 — ISDF', '2008 — ISDIAH', '2021 — RiC Records in Contexts'],
  },
  {
    id: 'n5',
    title: 'ENI, NEDA y normas técnicas de interoperabilidad',
    summary: 'ENI (RD 4/2010): principios de interoperabilidad. NTI de documento electrónico, expediente electrónico y digitalización (200 ppp mínimo). NEDA (Resolución 28/06/2012): norma española elaborada por CNEDA.',
    content: `**El Esquema Nacional de Interoperabilidad (ENI) — RD 4/2010**
Aprobado por Real Decreto 4/2010, de 8 de enero, en desarrollo de la Ley 11/2007 de acceso electrónico de los ciudadanos. Define principios y directrices para las relaciones electrónicas entre AAPP y con los ciudadanos.

Principios del ENI: interoperabilidad organizativa, semántica y técnica; reutilización y transferencia de tecnología; neutralidad tecnológica y adaptabilidad; uso de estándares abiertos.

**Normas Técnicas de Interoperabilidad (NTI) clave para archivos:**

**NTI de Documento Electrónico**: define la estructura del documento electrónico = contenido + metadatos + firma. Metadatos mínimos obligatorios: identificador, órgano, fecha de captura, origen, estado de elaboración, nombre del formato, tipo documental, tipo de firma.

**NTI de Expediente Electrónico**: conjunto de documentos electrónicos + índice del expediente (firmado electrónicamente) + metadatos del expediente. El índice garantiza la integridad del expediente.

**NTI de Digitalización de documentos**: requisitos técnicos del proceso de digitalización de documentos en papel. Resolución mínima: **200 ppp** para documentos textuales. Formatos admitidos: **PDF/A, JPEG2000, TIFF, PNG**. Incluye captura de metadatos y firma del resultado de digitalización.

**NTI de Política de Gestión de Documentos Electrónicos**: establece el marco para la gestión del ciclo de vida de los documentos electrónicos en la AGE.

**ENS — Esquema Nacional de Seguridad (RD 3/2010)**: complementario al ENI. Establece requisitos mínimos de seguridad. Categorías: alta, media, básica.

**NEDA — Norma Española de Descripción Archivística**
Aprobada por Resolución de **28 de junio de 2012** de la Secretaría de Estado de Cultura. Elaborada por la **CNEDA** (Comisión de Normas Españolas de Descripción Archivística). Adapta al contexto español las normas del ICA (ISAD(G), ISAAR(CPF), ISDF, ISDIAH).

La NEDA define un modelo conceptual en 5 entidades: Agente, Función, Documento de archivo, Descripción y Relación. Compatible con RiC y con los requisitos de la administración electrónica.`,
    keywords: ['ENI', 'RD 4/2010', 'NTI', 'Normas Técnicas de Interoperabilidad', 'documento electrónico', 'expediente electrónico', 'índice firmado', 'digitalización', '200 ppp mínimo', 'PDF/A', 'JPEG2000', 'TIFF', 'PNG', 'metadatos mínimos', 'ENS', 'RD 3/2010', 'NEDA', 'Resolución 28 junio 2012', 'CNEDA', 'Ley 11/2007', 'neutralidad tecnológica', 'estándares abiertos', 'interoperabilidad semántica'],
    laws: ['RD 4/2010 ENI', 'RD 3/2010 ENS', 'Ley 11/2007', 'Resolución 28 junio 2012 NEDA'],
    dates: ['2007 — Ley 11/2007 acceso electrónico', '2010 — RD 4/2010 ENI', '2010 — RD 3/2010 ENS', '2012 — Resolución NEDA 28 junio 2012'],
  },
  // ── CONSERVACIÓN ──────────────────────────────────────────────
  {
    id: 'con4',
    title: 'Edificios de archivo: depósitos, condiciones ambientales y planes de emergencia',
    summary: 'Teoría de los círculos concéntricos. Condiciones ambientales: T 18-20°C, HR 45-55%. Luz UV. Estanterías compactas. Extinciones por gas inerte. Plan de emergencia y prioridades de salvamento.',
    content: `La archivística exige a la arquitectura protección, neutralidad en materiales y condiciones óptimas para la conservación de los documentos. Partiendo de que no existe el edificio perfecto, se analizan las características que debe tener un edificio de archivos.

**Edificio ex novo vs. rehabilitación**
Nueva construcción: permite condiciones ideales de ubicación, materiales y distribución. Problema: en ciudades, espacio y coste obligan a la periferia, lejos de centros administrativos.
Rehabilitación: aprovecha edificios existentes (conventos, palacios), pero impone limitaciones estructurales. Los depósitos pueden alcanzar **1.200 kg/m²** de carga; los forjados deben soportarlo.

**Teoría de los círculos concéntricos de conservación**
Modelo de protección en capas desde el exterior hacia el documento:
1. Entorno urbanístico: alejado de industrias, inundaciones, aeropuertos
2. Edificio: materiales inertes, resistencia al fuego, impermeabilidad
3. Depósito: cámara con control ambiental estricto
4. Unidad de instalación: caja, envoltorio protector
5. Soporte documental: el propio documento

**Condiciones ambientales en depósitos**
- **Temperatura**: **18-20°C** para papel; **12-15°C** para fotografías, microfilm y soportes audiovisuales. Variaciones máximas: ±2°C.
- **Humedad relativa**: **45-55% HR** para papel; 30-40% HR para soportes fotográficos. Variaciones máximas: ±5%.
- **Iluminación**: ausencia de luz natural en depósitos (la luz **UV** deteriora papel y tintas). Fluorescentes con filtros UV o LED. Máximo: 50-100 lux en depósitos, 300 lux en sala de investigadores.
- **Calidad del aire**: filtros HEPA, control de SO₂ y NO₂, ventilación controlada.

**Zonas del edificio**
- Zona pública: recepción, sala de consulta, reproducción, exposiciones.
- Zona de trabajo: tratamiento técnico, restauración, digitalización.
- Zona de depósitos: acceso restringido; circuito independiente del público.
- Zona administrativa.

**Mobiliario**
- **Estanterías compactas (móviles)**: optimizan el espacio hasta un 45% respecto a estanterías fijas. No recomendadas para documentos muy pesados.
- Estanterías fijas metálicas: acero pintado al horno, sin zinc ni plomo. Separación del suelo: mínimo **15 cm**.
- Planeros para cartografía y formatos especiales.

**Planes de emergencia**
Deben contemplar: evacuación de personas, lista de prioridades de salvamento de documentos, protocolos contra incendio (extintores de **gas inerte** —argón, FM-200, Novec— en depósitos, **NO sprinklers de agua**), inundación, actos vandálicos.`,
    keywords: ['depósito', 'temperatura 18-20°C', 'fotografías 12-15°C', 'humedad relativa 45-55%', 'luz UV', '50-100 lux depósito', '300 lux sala', 'estanterías compactas', 'estanterías fijas 15cm', 'planero', 'círculos concéntricos', 'gas inerte', 'argón', 'FM-200', 'Novec', 'NO sprinklers', 'filtros HEPA', 'plan de emergencia', 'prioridades salvamento', '1200 kg/m²'],
    laws: [],
    dates: [],
  },
  {
    id: 'con5',
    title: 'Función social, difusión y cartas de servicios de los archivos',
    summary: 'Plan de difusión archivística. Tipología de usuarios. Condiciones de acceso (art. 57 LPHE): libre y gratuito. Restricciones por datos personales (25/50 años). Reproducciones. Cartas de Servicios (RD 951/2005). PARES y redes sociales.',
    content: `Los archivos no son solo centros de custodia: tienen una función social y cultural activa. La difusión es la función que pone en valor los fondos y los acerca a la sociedad.

**Plan de difusión archivística**
Documento que establece objetivos, actividades, recursos y sistema de evaluación de las acciones de difusión. Análisis del público objetivo → canales de comunicación → calendario → presupuesto → indicadores.

**Tipología de usuarios**
- **Usuarios administrativos**: personal de la propia administración que consulta antecedentes para la gestión.
- **Investigadores**: académicos y estudiantes de historia, genealogía, ciencias jurídicas.
- **Ciudadanos en general**: personas que buscan información sobre derechos, historia familiar, certificaciones.

**Condiciones de acceso y consulta** (art. 57 LPHE y RD 1708/2011)
Los archivos estatales son de acceso **libre y gratuito**. Restricciones:
- Documentos con **datos de carácter personal**: inaccesibles si el afectado vive, o durante **25 años** tras su muerte. Si no se conoce la fecha de fallecimiento: **50 años** desde la fecha del documento.
- Documentos **clasificados** (secreto, reservado): según la Ley de Secretos Oficiales.
- Documentos cuyo estado de **conservación** no permite la consulta.

**El Departamento de Referencias**
Gestiona las peticiones de documentos, orienta a investigadores, tramita reproducciones. Normas de sala: prohibido sacar documentos, usar bolígrafos, doblar páginas; uso de guantes para documentos frágiles.

**Reproducciones**
Por medios digitales (escáner, fotografía digital). Sujetas a **precios públicos** fijados por Orden Ministerial. Limitaciones: documentos frágiles, en restauración, sin autorización del titular de derechos de autor.

**Cartas de Servicios**
Documentos formales en los que el archivo se compromete públicamente con estándares de calidad. Reguladas por **RD 951/2005**, de 29 de julio, sobre mejora de la calidad en la AGE. Incluyen: compromisos de calidad, indicadores de evaluación y vías de reclamación.

**Difusión online y PARES**
PARES (Portal de Archivos Españoles) como principal herramienta de difusión online. Redes sociales institucionales: comunicar actividades, compartir documentos curiosos. Exposiciones virtuales, micrositios temáticos.`,
    keywords: ['difusión archivística', 'plan de difusión', 'usuarios administrativos', 'investigadores', 'acceso libre y gratuito', 'art. 57 LPHE', '25 años muerte', '50 años fecha documento', 'documentos clasificados', 'datos personales', 'Departamento de Referencias', 'normas de sala', 'reproducciones', 'precios públicos', 'Cartas de Servicios', 'RD 951/2005', 'PARES', 'redes sociales', 'exposiciones virtuales'],
    laws: ['Ley 16/1985 art. 57', 'RD 1708/2011', 'RD 951/2005'],
    dates: ['2005 — RD 951/2005 calidad AGE'],
  },
]

// ── Inyección automática (sin duplicados) ────────────────────────
const EXTRA_BY_BLOCK = {
  constitucion: ['c5','c6','c7','c8','c9'],
  legislacion:  ['l5','l6'],
  historia:     ['h4','h5','h6','h7','h8','h9','h10'],
  gestion:      ['g5','g6','g7','g8'],
  descripcion:  ['d4','d5','d6'],
  normas:       ['n4','n5','n6'],
  conservacion: ['con4','con5','con6'],
}

// ─── NUEVOS TEMAS — extraídos de los ZIPs de temario (Bloque 1, 2 y 3) ───────
// Añadidos sin duplicar lo existente. IDs: h7-h10, g7-g8, d6, n6, con6

const NEW_TOPICS = [

  // ══ HISTORIA — Archivo Guerra Civil, AHP, SAD, Sistema Archivístico ══════

  {
    id: 'h7',
    title: 'El Archivo de la Guerra Civil y el Centro Documental de la Memoria Histórica',
    summary: 'Origen, fondos y evolución del Archivo General de la Guerra Civil Española y su integración en el CDMH, creado por RD 426/1999 y ampliado por la Ley de Memoria Histórica de 2007.',
    content: `El Archivo General de la Guerra Civil Española fue creado por **RD 426/1999, de 12 de marzo**, con sede en Salamanca, tomando como núcleo el fondo existente en la sección de Guerra Civil del Archivo Histórico Nacional (AHN).

**Origen histórico**
Los documentos que lo forman proceden de las incautaciones realizadas por el bando nacional durante la Guerra Civil. En 1937 se crearon en el Cuartel General de Franco en Salamanca dos organismos:
- Oficina de Investigación y Propaganda Anticomunista (OIPA): para confiscar material republicano
- Delegación Nacional de Asuntos Especiales (DNAE): incautación de documentos de masones, republicanos y organizaciones afines

En 1938 se crea la **Delegación del Estado para la Recuperación de Documentos (DERD)**, que centralizó toda la documentación en Salamanca y la usó como fuente del Tribunal Especial para la Represión de la Masonería y el Comunismo (1940-1963).

**Evolución institucional**
- 1977: supresión de los Servicios Documentales; sus fondos se adscriben al AHN
- 1979: creación de la Sección de Guerra Civil del AHN (con sede en Salamanca)
- 1999: el RD 426/1999 le da entidad propia como Archivo General de la Guerra Civil Española
- 2007: la **Ley 52/2007 de Memoria Histórica** integra el archivo en el nuevo **Centro Documental de la Memoria Histórica (CDMH)**, también con sede en Salamanca

**Fondos documentales principales**
- Documentación del bando nacional: Gobierno del Estado franquista durante la guerra
- Fondo Masonería: el más importante a nivel mundial para el estudio de la masonería española
- Fondos de partidos políticos y sindicatos republicanos incautados
- Documentación de exiliados republicanos repatriada desde otros países
- Fondos del Tribunal de Represión de la Masonería y el Comunismo`,
    keywords: ['Guerra Civil', 'CDMH', 'Memoria Histórica', 'RD 426/1999', 'Ley 52/2007', 'Salamanca', 'DERD', 'DNAE', 'masonería', 'fondos incautados'],
    laws: ['RD 426/1999', 'Ley 52/2007'],
    dates: ['1937 — creación OIPA y DNAE', '1938 — creación DERD', '1977 — supresión Servicios Documentales', '1979 — Sección Guerra Civil AHN', '1999 — Archivo General Guerra Civil', '2007 — Centro Documental Memoria Histórica'],
  },

  {
    id: 'h8',
    title: 'Los Archivos Históricos Provinciales: historia, normativa y competencias',
    summary: 'Creación y evolución de los Archivos Históricos Provinciales desde 1931, su normativa reguladora, fondos notariales y distribución competencial entre Estado y Comunidades Autónomas.',
    content: `Los Archivos Históricos Provinciales (AHP) son centros del Sistema Archivístico Español gestionados en muchas comunidades autónomas por las propias CCAA, aunque de titularidad mixta o estatal.

**Marco constitucional y competencial**
El art. 149.1.28 CE reserva al Estado la "defensa del patrimonio cultural contra la exportación y la expoliación; museos, bibliotecas y archivos de titularidad estatal, sin perjuicio de su gestión por las CCAA". El art. 148.1.15 CE permite a las CCAA asumir competencias sobre museos, bibliotecas y conservatorios de música de interés autonómico. Aunque la CE no menciona expresamente los archivos, todas las CCAA los han incluido en sus Estatutos.

**Legislación autonómica**
Las bases legales son los RR.DD. 111/1986 y 64/1994. Andalucía (1984) y Cataluña (1985) fueron las primeras CCAA en desarrollar legislación específica de archivos. Cada autonomía ha ido aprobando su propia Ley de Patrimonio Documental y Archivos.

**Etapas de creación y consolidación**
- 1931-1945 — Etapa de creación: Decreto de 12 de noviembre de 1931 crea los primeros AHP como archivos de distrito notarial
- 1945-1969 — Etapa de formación: se completa la red y se define su organización
- 1969-1980 — Etapa de consolidación: el Decreto 914/1969 y el RD 1708/2011 refuerzan el sistema
- 1980-actualidad — Adaptación al Estado de las Autonomías: transferencia de la gestión a las CCAA

**Fondos documentales principales**
- Fondos notariales: el más característico de estos archivos; concentran los protocolos notariales de la provincia
- Fondos del Registro de la Propiedad y Mercantil
- Fondos de organismos de la Administración periférica del Estado
- Fondos de la Administración de Justicia (audiencias provinciales, juzgados)
- Fondos de instituciones religiosas desamortizadas
- Fondos de organismos y entidades de la provincia`,
    keywords: ['Archivos Históricos Provinciales', 'fondos notariales', 'competencias CCAA', 'RD 111/1986', 'RD 64/1994', 'legislación autonómica', 'desamortización', 'titularidad estatal'],
    laws: ['CE art. 149.1.28', 'CE art. 148.1.15', 'RD 111/1986', 'RD 64/1994'],
    dates: ['1931 — Decreto creación AHP', '1969 — Decreto 914/1969 AGA', '1984 — Ley Archivos Andalucía (primera CCAA)', '1985 — Ley Archivos Cataluña'],
  },

  {
    id: 'h9',
    title: 'El Sistema Archivístico de la Defensa (SAD)',
    summary: 'Organización, normativa y tipos de archivo del Sistema Archivístico de la Defensa, regulado por el RD 2598/1998 y sus archivos históricos militares.',
    content: `El **Sistema Archivístico de la Defensa (SAD)** se rige por su propia normativa conforme al RD 1708/2011, excepto en las cuestiones relativas al acceso, que siguen el régimen general.

**Normativa reguladora**
- **RD 2598/1998, de 4 de diciembre**, que aprueba el **Reglamento de Archivos Militares (RAM)**: establece la organización y funcionamiento del SAD
- El art. 149.1.4ª CE reserva al Estado competencias exclusivas en Defensa y Fuerzas Armadas, lo que justifica la autonomía del sistema militar respecto al civil

**Organización del SAD**
El SAD se estructura en cuatro subsistemas, correspondientes a:
- Subsistema del Ejército de Tierra
- Subsistema de la Armada
- Subsistema del Ejército del Aire y del Espacio
- Subsistema conjunto (Ministerio de Defensa)

**Archivos Históricos del Ejército de Tierra**
- Archivo General Militar de Segovia (personal militar)
- Archivo General Militar de Madrid (organismos centrales)
- Archivo General Militar de Guadalajara (asuntos civiles de la guerra)
- Archivo General Militar de Ávila (documentación de la Guerra Civil)
- Archivo Cartográfico y de Estudios Geográficos (Servicio Geográfico)

**Archivos Históricos de la Armada**
- Archivo Histórico de la Armada "Juan Sebastián Elcano"
- Archivo General de Marina "Álvaro de Bazán" (en Viso del Marqués, Ciudad Real): fondos de la Armada desde el siglo XVI
- Archivo Histórico del Instituto Hidrográfico de la Marina
- Real Instituto y Observatorio de la Armada (San Fernando, Cádiz)

**Otros archivos históricos del SAD**
- Archivo Histórico del Ejército del Aire y del Espacio
- Archivo General e Histórico de la Defensa
- Archivos Judiciales Militares`,
    keywords: ['SAD', 'Sistema Archivístico Defensa', 'RD 2598/1998', 'Reglamento Archivos Militares', 'Álvaro de Bazán', 'Archivo Segovia', 'subsistemas', 'archivos militares'],
    laws: ['RD 2598/1998', 'RD 1708/2011', 'CE art. 149.1.4'],
    dates: ['1998 — RD 2598/1998 Reglamento Archivos Militares', '2011 — RD 1708/2011 Sistema Español de Archivos'],
  },

  {
    id: 'h10',
    title: 'El Sistema Español de Archivos y el Consejo de Cooperación Archivística',
    summary: 'Evolución histórica del sistema archivístico español desde el siglo XIX, su configuración constitucional y el Consejo de Cooperación Archivística: composición, funciones y comisiones.',
    content: `El sistema archivístico español es fruto de la transformación de un Estado centralista en un Estado autonómico que ha repercutido en la organización del patrimonio documental.

**Evolución histórica**
La estructura básica arranca con el Archivo Real de Barcelona (fin s. XII, origen del ACA). Las reformas de los Reyes Católicos configuran un modelo tripartito: gobierno, justicia y organización territorial. La Chancillería de Valladolid (Ordenanzas de 1485) y el Archivo General de Simancas (s. XVI) son hitos clave.

En el s. XIX, el proceso desamortizador y la creación del AHN (1866) marcan la entrada en la modernidad. El Cuerpo Facultativo de Archiveros, Bibliotecarios y Arqueólogos se crea en 1858.

**Configuración constitucional (desde 1978)**
El RD 1708/2011, de 18 de noviembre, establece el **Sistema Archivístico Español** vigente, articulado en:
- Sistema de Archivos de la Administración General del Estado
- Sistema Archivístico de la Defensa
- Sistemas archivísticos de las CCAA
- Sistemas archivísticos de las Entidades Locales
- Archivos de otras instituciones públicas (Cortes, TC, CGPJ, etc.)
- Archivos privados de interés público

**El Consejo de Cooperación Archivística**
Creado por el RD 1708/2011 como órgano consultivo y de cooperación entre la AGE y las CCAA.

Funciones principales:
- Asesorar en la planificación de la política archivística española
- Impulsar la cooperación entre administraciones
- Emitir informes sobre normas de descripción y acceso
- Velar por la coherencia del sistema

Composición: presidido por el titular de la Subdirección General de Archivos Estatales; integrado por representantes de todas las CCAA, la FEMP y expertos del sector.

Se organiza en comisiones técnicas especializadas en: descripción, conservación, acceso y administración electrónica.`,
    keywords: ['Sistema Español de Archivos', 'Consejo de Cooperación Archivística', 'RD 1708/2011', 'Cuerpo Facultativo', '1858', 'FEMP', 'sistemas autonómicos', 'cooperación'],
    laws: ['RD 1708/2011', 'CE art. 149.1.28'],
    dates: ['1485 — Ordenanzas Chancillería Valladolid', '1858 — Cuerpo Facultativo Archiveros', '1866 — AHN', '1978 — Constitución', '2011 — RD 1708/2011'],
  },

  // ══ GESTIÓN — Difusión, atención a usuarios y cartas de servicios ════════

  {
    id: 'g7',
    title: 'Función social y cultural de los archivos: difusión y comunicación',
    summary: 'La difusión como función archivística fundamental: definición, planes de difusión, Internet y redes sociales, exposiciones, publicaciones y actividades educativas.',
    content: `La difusión es una función archivística fundamental cuya finalidad es hacer accesible el patrimonio documental a la sociedad en sentido amplio.

**Definición**
El Diccionario de Terminología Archivística del Ministerio de Cultura define la difusión como la "función archivística fundamental cuya finalidad es, por una parte, hacer accesibles los fondos del archivo y, por otra, fomentar su utilización y conocimiento". La CE recoge en su art. 44 la obligación de los poderes públicos de promover y tutelar el acceso a la cultura.

**Plan de difusión**
Un plan de difusión archivística debe contemplar:
- Diagnóstico: análisis de usuarios, fondos y recursos
- Objetivos: qué se quiere comunicar y a quién
- Canales y acciones: online y presenciales
- Presupuesto y evaluación de resultados

**Difusión online**
- Portales web del archivo (descripción, búsquedas, descarga de imágenes)
- **PARES** (Portal de Archivos Españoles): acceso libre a fondos de los archivos estatales
- Redes sociales: Twitter/X, Instagram, Facebook, YouTube para conectar con nuevos públicos
- Exposiciones virtuales y micrositios temáticos
- Juegos de descubrimiento y autoaprendizaje
- Experiencias internacionales: Discovery (Archivos Nacionales del Reino Unido)

**Actividades presenciales tradicionales**
- Exposiciones físicas con catálogos
- Publicaciones científicas y divulgativas
- Visitas guiadas y talleres escolares (servicios educativos)
- Jornadas de puertas abiertas
- Colaboración con universidades e institutos de investigación

**Cooperación internacional**
Organismos de referencia: ICA (Consejo Internacional de Archivos), EURBICA (rama europea), DLM Forum (documentos electrónicos).`,
    keywords: ['difusión', 'función social', 'PARES', 'redes sociales', 'exposiciones', 'plan de difusión', 'servicios educativos', 'ICA', 'art. 44 CE'],
    laws: ['CE art. 44'],
    dates: [],
  },

  {
    id: 'g8',
    title: 'Atención a usuarios, acceso a documentos y cartas de servicios',
    summary: 'Condiciones de acceso a los archivos, sala de investigadores, reproducción de documentos, perfil del usuario moderno y las cartas de servicios como instrumento de calidad.',
    content: `La atención a los usuarios es una de las funciones más visibles de los archivos, y ha experimentado una profunda transformación con la llegada de Internet y la apertura de los archivos a nuevos públicos.

**Evolución del perfil del usuario**
El usuario tradicional de los archivos era el investigador histórico especializado. Hoy conviven:
- Investigadores profesionales (historiadores, juristas)
- Ciudadanos que buscan antecedentes administrativos o genealógicos
- Estudiantes universitarios
- Profesionales de distintas disciplinas
- Usuarios online que acceden de forma remota

**El acceso a los documentos**
El derecho de acceso está regulado por:
- **Ley 19/2013 de Transparencia** y la Ley 16/1985 (LPHE) para el patrimonio histórico
- Las normas de sala establecen las condiciones de consulta presencial
- Documentos con restricciones: datos personales (RGPD), secreto oficial, derechos de autor

**Departamento de Referencias y sala de investigadores**
Funciones del departamento de referencias:
- Orientación y asesoramiento al investigador
- Gestión de solicitudes de documentos (boletines de petición)
- Control de acceso a originales y reproductografía

**Reproducción de documentos**
- Digitalización bajo demanda, microfilm, fotocopia (según estado de conservación)
- Precios públicos establecidos por normativa
- Limitaciones: documentos frágiles, con restricciones legales o derechos de autor

**Cartas de servicios**
Las cartas de servicios son documentos que informan a los ciudadanos sobre los servicios que presta el archivo, los compromisos de calidad y los derechos de los usuarios. Se regulan por el **RD 951/2005, de 29 de julio**, sobre mejora de la calidad en la AGE. Incluyen:
- Identificación de los servicios prestados
- Compromisos de calidad medibles (plazos de respuesta, disponibilidad)
- Mecanismos de sugerencias y quejas
- Indicadores de seguimiento`,
    keywords: ['atención usuarios', 'sala de investigadores', 'cartas de servicios', 'RD 951/2005', 'reproducción documentos', 'acceso documentos', 'departamento referencias', 'precios públicos'],
    laws: ['Ley 19/2013', 'Ley 16/1985', 'RD 951/2005'],
    dates: ['2005 — RD 951/2005 mejora calidad AGE'],
  },

  // ══ DESCRIPCIÓN — Instrumentos y agrupaciones (complemento a d4 y d5) ════

  {
    id: 'd6',
    title: 'Planificación descriptiva: normalización e intercambio de información',
    summary: 'La descripción multinivel, la normalización como base del intercambio automatizado, los estándares EAD y EAC, y el proyecto NEDA-MC como modelo conceptual español.',
    content: `La planificación descriptiva tiene como objetivo garantizar la sistematización de las descripciones archivísticas para facilitar el intercambio automatizado de información entre instituciones.

**Normalización y sus finalidades**
La normalización persigue:
- Sistematizar y optimizar los procesos descriptivos
- Permitir el intercambio automatizado de información entre archivos de distintos países
- Facilitar el acceso del usuario mediante estructuras de datos coherentes

Sin una norma comúnmente aceptada, la información solo puede circular mediante equivalencias personalizadas o traducción manual, lo que ralentiza enormemente la difusión.

**Estándares internacionales de codificación**
- **EAD (Encoded Archival Description)**: estándar XML para codificar instrumentos de descripción conforme a ISAD(G). Permite la publicación y el intercambio electrónico de inventarios y catálogos.
- **EAC-CPF (Encoded Archival Context – Corporate Bodies, Persons and Families)**: para codificar registros de autoridad conforme a ISAAR(CPF)
- **Schema AED3**: nuevo esquema de datos para los archivos europeos; su cambio afecta al intercambio entre archivos nacionales

**NEDA-MC — Modelo Conceptual de Descripción Archivística**
Elaborado por la **CNEDA (Comisión de Normas Españolas de Descripción Archivística)**, el NEDA-MC define:
- Entidades: documento, agente, función, lugar, concepto/objeto/acontecimiento
- Relaciones entre entidades (muchos a muchos)
- Atributos de cada entidad alineados con las normas internacionales

**Informatización de los Archivos Estatales**
Proceso en varias fases:
1. AER (Archivos Españoles en Red): primera plataforma de descripción compartida
2. PARES: evolución hacia un portal público de acceso libre con visor integrado
El sistema PARES permite búsqueda simple, avanzada y en árbol de fondos, visualización de imágenes y descarga, geolocalización y conexión con Europeana vía OAI-PMH.`,
    keywords: ['EAD', 'EAC-CPF', 'NEDA-MC', 'CNEDA', 'normalización', 'intercambio automatizado', 'AER', 'PARES', 'schema AED3', 'descripción multinivel'],
    laws: [],
    dates: ['2006 — propuesta NEDA publicada por SGAE'],
  },

  // ══ NORMAS — Normas internacionales (complemento a n4) ═══════════════════

  {
    id: 'n6',
    title: 'Normas de sala y reglamentos de acceso a archivos estatales',
    summary: 'Las normas generales de acceso y consulta en los archivos estatales españoles: solicitud de documentos, identificación del investigador, uso de sala y reproducciones.',
    content: `Los archivos estatales españoles aplican unas **Normas Generales para el Acceso y Consulta de Documentos**, aprobadas por la Subdirección General de los Archivos Estatales del Ministerio de Cultura.

**Requisitos de acceso**
- Identificación obligatoria del investigador (DNI, pasaporte o documento equivalente)
- Cumplimentación de la hoja de registro del investigador en su primera visita
- Firma del reglamento de la sala y compromiso de respeto a las normas

**Solicitud de documentos**
- Las peticiones se realizan mediante boletines de solicitud normalizados
- Cada archivo establece un número máximo de unidades entregadas por sesión
- Los documentos se entregan en la sala de investigadores y no pueden salir de ella

**Uso de sala**
- Prohibición de introducir bolígrafos, comida o bebida (se permiten lápices)
- Uso de guantes para documentos especialmente frágiles
- Prohibición de ordenar o manipular los documentos
- Posibilidad de usar cámaras fotográficas sin flash (según reglamento del archivo)

**Reproducciones**
- Solicitud mediante impreso normalizado
- Precios públicos aprobados por Orden Ministerial
- Limitaciones por estado de conservación, restricciones legales o derechos de autor
- Los archivos pueden negar la reproducción si supone riesgo para el documento

**Restricciones de acceso**
- Documentos clasificados (Ley de Secretos Oficiales)
- Datos de carácter personal (RGPD y legislación de protección de datos)
- Documentos con derechos de autor vigentes
- Documentos en mal estado de conservación que requieren restauración previa`,
    keywords: ['normas de sala', 'acceso archivos', 'investigadores', 'boletín solicitud', 'reproducciones', 'restricciones acceso', 'SGAE', 'precios públicos', 'RGPD'],
    laws: ['Ley 16/1985', 'Ley 19/2013', 'RGPD'],
    dates: [],
  },

  // ══ CONSERVACIÓN — Edificio y función social (complemento a con4 y con5) ══

  {
    id: 'con6',
    title: 'Soportes fotográficos, magnéticos y ópticos: deterioro y conservación',
    summary: 'Características y patologías de los soportes fotográficos (plata, color), magnéticos (cintas, discos) y ópticos (CD, DVD), y sus condiciones específicas de conservación.',
    content: `Además del papel y el pergamino, los archivos custodian importantes volúmenes de documentación en soportes especiales que requieren condiciones de conservación específicas.

**Soportes fotográficos**
- Daguerrotipo (1839): soporte de plata sobre cobre; extremadamente sensible a la humedad y los sulfuros
- Fotografía en blanco y negro sobre gelatina de plata: soporte plástico (nitratos hasta 1950, acetatos y poliéster después); los nitratos son altamente inflamables
- Fotografía en color (cromogénica): mayor inestabilidad que el B/N; pérdida de densidad y desvanecimiento de colorantes con el tiempo
- Condiciones de conservación: temperatura baja (idealmente ≤10°C), humedad relativa 30-40%

**Soportes magnéticos**
- Cintas magnéticas de audio y vídeo: deterioro por hidrólisis del aglutinante (síndrome del aglutinante pegajoso o "sticky shed syndrome")
- Discos magnéticos (diskettes, discos duros): obsolescencia tecnológica como principal amenaza
- Condiciones de conservación: temperatura 8-18°C, HR 20-40%, alejados de campos magnéticos

**Soportes ópticos**
- CD y DVD: deterioro por delaminación, oxidación de la capa reflectante y roturas en el lacado
- Vida útil estimada muy variable (50-200 años según fabricación y condiciones)
- CD-R y DVD-R (grabables): más vulnerables que los prensados industrialmente
- El principal riesgo es la **obsolescencia tecnológica**: pérdida de lectores y software capaces de acceder al contenido

**Estrategias de preservación digital**
La OAIS (ISO 14721) recomienda:
- Migración: transferir el contenido a nuevos formatos y soportes periódicamente
- Emulación: recrear entornos tecnológicos obsoletos
- Refreshing: copiar el contenido bit a bit a nuevos soportes antes de la degradación`,
    keywords: ['soportes fotográficos', 'nitratos', 'soportes magnéticos', 'sticky shed syndrome', 'soportes ópticos', 'obsolescencia tecnológica', 'daguerrotipo', 'migración', 'emulación', 'OAIS'],
    laws: ['ISO 14721'],
    dates: ['1839 — invención del daguerrotipo', '1950 — sustitución nitratos por acetatos'],
  },
]

// Registrar los nuevos tópicos en EXTRA_TOPICS para que el sistema los procese
;(function() {
  NEW_TOPICS.forEach(t => EXTRA_TOPICS.push(t))
})()

;(function() {
  const byId = {}
  EXTRA_TOPICS.forEach(t => { byId[t.id] = t })
  STUDY_BLOCKS.forEach(block => {
    const ids = EXTRA_BY_BLOCK[block.id] || []
    const existing = new Set(block.topics.map(t => t.id))
    ids.forEach(id => {
      if (!existing.has(id) && byId[id]) block.topics.push(byId[id])
    })
  })
})()
