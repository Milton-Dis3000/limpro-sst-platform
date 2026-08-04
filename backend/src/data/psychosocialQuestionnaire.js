import { RESPONSE_OPTIONS } from "../utils/constants.js";

const range = (min, max) => ({ min, max });

export const psychosocialQuestionnaire = {
  nombre: "Cuestionario de evaluación psicosocial en espacios laborales",
  pais: "Ecuador",
  modulo: "psicosocial",
  version: "1.0.0",
  opcionesRespuesta: RESPONSE_OPTIONS,
  instrucciones: [
    "El cuestionario es anónimo es decir no se solicita información personal sobre el participante.",
    "La información obtenida es confidencial es decir que se ha de guardar, mantener y emplear con estricta cautela la información obtenida.",
    "Completar todo el cuestionario requiere entre 15 a 20 minutos.",
    "Antes de responder, leer detenidamente cada pregunta y opción de respuesta. En este punto es necesario identificar y valorar todos aquellos factores del ámbito psicosocial que pueden representar un riesgo para la salud y el bienestar laboral.",
    "Utilizar lápiz o esfero para marcar con una “X” la respuesta que considere que describe mejor su situación. Es obligatorio contestar todos los ítems del cuestionario, en caso de error en la respuesta encerrar en un círculo la misma y seleccionar nuevamente la respuesta.",
    "No existen respuestas correctas o incorrectas.",
    "Evitar distracciones mientras completa el cuestionario, en caso de inquietud, solicitar asistencia al facilitador.",
    "El cuestionario tiene una sección denominada “observaciones y comentarios”, que puede ser utilizada por los participantes en caso de sugerencias u opiniones.",
    "Los resultados finales de la evaluación serán socializados oportunamente a los participantes."
  ],
  datosGenerales: [
    { id: "fecha", label: "Fecha:", type: "date" },
    { id: "provincia", label: "Provincia:", type: "text" },
    { id: "ciudad", label: "Ciudad:", type: "text" },
    { id: "areaTrabajo", label: "Área de trabajo:", type: "choice", options: ["Administrativa", "Operativa"] },
    {
      id: "nivelInstruccion",
      label: "Nivel más alto de instrucción (Maque una sola opción) :",
      type: "choice",
      options: ["Ninguno", "Técnico / Tecnológico", "Educación básica", "Tercer nivel", "Educación media", "Cuarto nivel", "Bachillerato", "Otro"]
    },
    {
      id: "antiguedad",
      label: "Antigüedad, años de experiencia dentro de la empresa o institución:",
      type: "choice",
      options: ["0-2años", "3-10años", "11-20años", "Igual o superior a 21 años"]
    },
    {
      id: "edad",
      label: "Edad del trabajador o servidor:",
      type: "choice",
      options: ["16-24 años", "25-34años", "35-43años", "44-52años", "Igual o superior a 53 años"]
    },
    {
      id: "autoIdentificacionEtnica",
      label: "Auto-identificación étnica:",
      type: "choice",
      options: ["Indígena", "Afro -ecuatoriano:", "Mestizo/a:", "Blanco/a:", "Montubio/a:", "Otro:"]
    },
    { id: "sexo", label: "Sexo del trabajador o servidor:", type: "choice", options: ["Mujer:", "Hombre:"] }
  ],
  preguntas: [
    [1, "Carga y ritmo de trabajo", "Considero que son aceptables las solicitudes y requerimientos que me piden otras personas (compañeros de trabajo, usuarios, clientes)"],
    [2, "Carga y ritmo de trabajo", "Decido el ritmo de trabajo en mis actividades"],
    [3, "Carga y ritmo de trabajo", "Las actividades y/o responsabilidades que me fueron asignadas no me causan estrés"],
    [4, "Carga y ritmo de trabajo", "Tengo suficiente tiempo para realizar todas las actividades que me han sido encomendadas dentro de mi jornada laboral"],
    [5, "Desarrollo de competencias", "Considero que tengo los suficientes conocimientos, habilidades y destrezas para desarrollar el trabajo para el cual fui contratado"],
    [6, "Desarrollo de competencias", "En mi trabajo aprendo y adquiero nuevos conocimientos, habilidades y destrezas de mis compañeros de trabajo"],
    [7, "Desarrollo de competencias", "En mi trabajo se cuenta con un plan de carrera, capacitación y/o entrenamiento para el desarrollo de mis conocimientos, habilidades y destrezas"],
    [8, "Desarrollo de competencias", "En mi trabajo se evalúa objetiva y periódicamente las actividades que realizo"],
    [9, "Liderazgo", "En mi trabajo se reconoce y se da crédito a la persona que realiza un buen trabajo o logran sus objetivos."],
    [10, "Liderazgo", "Mi jefe inmediato esta dispuesto a escuchar propuestas de cambio e iniciativas de trabajo"],
    [11, "Liderazgo", "Mi jefe inmediato establece metas, plazos claros y factibles para el cumplimiento de mis funciones o actividades"],
    [12, "Liderazgo", "Mi jefe inmediato interviene, brinda apoyo, soporte y se preocupa cuando tengo demasiado trabajo que realizar"],
    [13, "Liderazgo", "Mi jefe inmediato me brinda suficientes lineamientos y retroalimentación para el desempeño de mi trabajo"],
    [14, "Liderazgo", "Mi jefe inmediato pone en consideración del equipo de trabajo, las decisiones que pueden afectar a todos."],
    [15, "Margen de acción y control", "En mi trabajo existen espacios de discusión para debatir abiertamente los problemas comunes y diferencias de opinión"],
    [16, "Margen de acción y control", "Me es permitido realizar el trabajo con colaboración de mis compañeros de trabajo y/u otras áreas"],
    [17, "Margen de acción y control", "Mi opinión es tomada en cuenta con respecto a fechas límites en el cumplimiento de mis actividades o cuando exista cambio en mis funciones"],
    [18, "Margen de acción y control", "Se me permite aportar con ideas para mejorar las actividades y la organización del trabajo"],
    [19, "Organización del trabajo", "Considero que las formas de comunicación en mi trabajo son adecuados, accesibles y de fácil comprensión"],
    [20, "Organización del trabajo", "En mi trabajo se informa regularmente de la gestión y logros de la empresa o institución a todos los trabajadores y servidores"],
    [21, "Organización del trabajo", "En mi trabajo se respeta y se toma en consideración las limitaciones de las personas con discapacidad para  la asignación de roles y tareas"],
    [22, "Organización del trabajo", "En mi trabajo tenemos reuniones suficientes y significantes para el cumplimiento de los objetivos"],
    [23, "Organización del trabajo", "Las metas y objetivos en mi trabajo son claros y alcanzables"],
    [24, "Organización del trabajo", "Siempre dispongo de tareas y actividades a realizar en mi jornada y lugar de trabajo"],
    [25, "Recuperación", "Después del trabajo tengo la suficiente energía como para realizar otras actividades"],
    [26, "Recuperación", "En mi trabajo se me permite realizar pausas de periodo corto para renovar y recuperar la energía."],
    [27, "Recuperación", "En mi trabajo tengo tiempo para dedicarme a reflexionar sobre mi desempeño en el trabajo"],
    [28, "Recuperación", "Tengo un horario y jornada de trabajo que se ajusta a mis expectativas y exigencias laborales"],
    [29, "Recuperación", "Todos los días siento que he descansado lo suficiente y que tengo la energía para iniciar mi trabajo"],
    [30, "Soporte y apoyo", "El trabajo está organizado de tal manera que  fomenta la colaboración de equipo y el diálogo con otras personas"],
    [31, "Soporte y apoyo", "En mi trabajo percibo un sentimiento de compañerismo y bienestar con mis colegas"],
    [32, "Soporte y apoyo", "En mi trabajo se brinda el apoyo necesario a los trabajadores sustitutos o trabajadores con algún grado de discapacidad y enfermedad"],
    [33, "Soporte y apoyo", "En mi trabajo se me brinda ayuda técnica y administrativa cuando lo requiero"],
    [34, "Soporte y apoyo", "En mi trabajo tengo acceso a la atención de un médico, psicólogo, trabajadora social, consejero, etc. en situaciones de crisis y/o rehabilitación"],
    [35, "Otros puntos importantes", "En mi trabajo tratan por igual a todos, indistintamente la edad que tengan"],
    [36, "Otros puntos importantes", "Las directrices y metas que me autoimpongo, las cumplo dentro de mi jornada y horario de trabajo"],
    [37, "Otros puntos importantes", "En mi trabajo existe un buen ambiente laboral"],
    [38, "Otros puntos importantes", "Tengo un trabajo donde los hombres y mujeres tienen las mismas oportunidades"],
    [39, "Otros puntos importantes", "En mi trabajo me siento aceptado y valorado"],
    [40, "Otros puntos importantes", "Los espacios y ambientes físicos en mi trabajo brindan las facilidades para el acceso de las personas con discapacidad"],
    [41, "Otros puntos importantes", "Considero que mi trabajo esta libre de amenazas, humillaciones, ridiculizaciones, burlas, calumnias o difamaciones reiteradas con el fin de causarme daño."],
    [42, "Otros puntos importantes", "Me siento estable a pesar de cambios que se presentan en mi trabajo."],
    [43, "Otros puntos importantes", "En mi trabajo estoy libre de conductas sexuales que afecten mi integridad física, psicológica y moral"],
    [44, "Otros puntos importantes", "Considero que el trabajo que realizo no me causa efectos negativos a mi salud física y mental"],
    [45, "Otros puntos importantes", "Me resulta fácil relajarme cuando no estoy trabajando"],
    [46, "Otros puntos importantes", "Siento que mis problemas familiares o personales no influyen en el desempeño de las actividades en el trabajo"],
    [47, "Otros puntos importantes", "Las instalaciones, ambientes, equipos, maquinaria y herramientas que utilizo para realizar el trabajo son las adecuadas para no sufrir accidentes de trabajo y enfermedades profesionales"],
    [48, "Otros puntos importantes", "Mi trabajo esta libre de acoso sexual"],
    [49, "Otros puntos importantes", "En mi trabajo se me permite solucionar mis problemas familiares y personales"],
    [50, "Otros puntos importantes", "Tengo un trabajo libre de conflictos estresantes, rumores maliciosos o calumniosos sobre mi persona."],
    [51, "Otros puntos importantes", "Tengo un equilibrio y separo bien el trabajo de mi vida personal."],
    [52, "Otros puntos importantes", "Estoy orgulloso de trabajar en mi empresa o institución"],
    [53, "Otros puntos importantes", "En mi trabajo se respeta mi ideología, opinión política, religiosa, nacionalidad y orientación sexual."],
    [54, "Otros puntos importantes", "Mi trabajo y los aportes que realizo son valorados y me generan motivación."],
    [55, "Otros puntos importantes", "Me siento libre de culpa cuando no estoy trabajando en algo"],
    [56, "Otros puntos importantes", "En mi trabajo no existen espacios de uso exclusivo de un grupo determinado de personas ligados a un privilegio, por ejemplo, cafetería exclusiva, baños exclusivos, etc., mismo que causa malestar y perjudica mi ambiente laboral"],
    [57, "Otros puntos importantes", "Puedo dejar de pensar en el trabajo durante mi tiempo libre (pasatiempos, actividades de recreación, otros)"],
    [58, "Otros puntos importantes", "Considero que me encuentro física y mentalmente saludable"],
    [59, "Observaciones y comentarios", "n/a", false]
  ].map(([order, dimension, text, required = true]) => ({ order, dimension, text, required })),
  dimensiones: [
    { code: "D1", name: "Carga y ritmo de trabajo", description: "Conjunto de requerimientos mentales y físicos a los cuales se ve sometida una persona en su trabajo, exceso de trabajo o insuficiente, tiempo y velocidad para realizar una determinada tarea, la que puede ser constante o variable.", items: [1, 2, 3, 4], ranges: { bajo: range(13, 16), medio: range(8, 12), alto: range(4, 7) } },
    { code: "D2", name: "Desarrollo de competencias", description: "Oportunidades de desarrollar competencias (destrezas, habilidades, conocimientos, actitudes de las personas) conforme a las demandas actuales del trabajo y aplicarlas en el ámbito laboral.", items: [5, 6, 7, 8], ranges: { bajo: range(13, 16), medio: range(8, 12), alto: range(4, 7) } },
    { code: "D3", name: "Liderazgo", description: "Características personales y habilidades para dirigir, coordinar, retroalimentar, motivar, modificar conductas del equipo, influenciar a las personas en el logro de objetivos, compartir una visión, colaborar, proveer información, dialogar, reconocer logros, entre otras.", items: [9, 10, 11, 12, 13, 14], ranges: { bajo: range(18, 24), medio: range(12, 17), alto: range(6, 11) } },
    { code: "D4", name: "Margen de acción y control", description: "Medida en la que una persona participa en la toma de decisiones en relación con su rol en el trabajo (métodos y ritmo de trabajo, horarios, entorno, otros factores laborales.)", items: [15, 16, 17, 18], ranges: { bajo: range(13, 16), medio: range(8, 12), alto: range(4, 7) } },
    { code: "D5", name: "Organización del trabajo", description: "Contempla las formas de comunicación, la tecnología, la modalidad de distribución y designación del trabajo, así como las demandas cualitativas y cuantitativas del trabajo.", items: [19, 20, 21, 22, 23, 24], ranges: { bajo: range(18, 24), medio: range(12, 17), alto: range(6, 11) } },
    { code: "D6", name: "Recuperación", description: "Tiempo destinado para el descanso y recuperación de energía luego de realizar esfuerzo físico y/o mental relacionado al trabajo; así como tiempo destinado a la recreación, distracción, tiempo de vida familiar, y otras actividades sociales extralaborales.", items: [25, 26, 27, 28, 29], ranges: { bajo: range(16, 20), medio: range(10, 15), alto: range(5, 9) } },
    { code: "D7", name: "Soporte y apoyo", description: "Acciones y recursos formales e informales que aplican los mandos superiores y compañeras/os de trabajo para facilitar la solución de problemas planteados frente a temas laborales y extralaborales.", items: [30, 31, 32, 33, 34], ranges: { bajo: range(16, 20), medio: range(10, 15), alto: range(5, 9) } },
    { code: "D8", name: "Otros puntos importantes", items: Array.from({ length: 24 }, (_, i) => i + 35), ranges: { bajo: range(73, 96), medio: range(49, 72), alto: range(24, 48) } },
    { code: "D8.1", parent: "D8", name: "Acoso discriminatorio", description: "Trato desigual, exclusión o preferencia hacia una persona, basados en la identidad de género, orientación sexual, edad, discapacidad, estado de salud, enfermedad, etnia, idioma, religión, nacionalidad, lugar de nacimiento, ideología, opinión política, condición migratoria, estado civil, pasado judicial, estereotipos estéticos, encontrarse en periodo de gestación, lactancia o cualquier otra, que tenga por efecto anular, alterar o impedir el pleno ejercicio de los derechos individuales o colectivos, en los procesos de selección y durante la existencia de la relación laboral.", items: [35, 38, 53, 56], ranges: { bajo: range(13, 16), medio: range(8, 12), alto: range(4, 7) } },
    { code: "D8.2", parent: "D8", name: "Acoso laboral", description: "Forma de acoso psicológico que consiste en el hostigamiento intencional, repetitivo, focalizado a través de acciones vindicativas, crueles o maliciosas para humillar o desestabilizar a un individuo o a grupos de trabajadoras/es y/o servidores, de carácter instrumental o finalista.", items: [41, 50], ranges: { bajo: range(7, 8), medio: range(5, 6), alto: range(2, 4) } },
    { code: "D8.3", parent: "D8", name: "Acoso sexual", description: "Insinuaciones sexuales no deseadas que afectan la integridad física, psicológica y moral de las/os trabajadoras/es  y/o servidor.", items: [43, 48], ranges: { bajo: range(7, 8), medio: range(5, 6), alto: range(2, 4) } },
    { code: "D8.4", parent: "D8", name: "Adicción al trabajo", description: "Dificultad de la persona a desconectarse del trabajo, necesidad para asumir más y más tarea que puede dar lugar a un riesgo psicosocial es cuando el valor del trabajo es superior a la relación consigo mismo y a las relaciones con otros. Una particularidad de la adicción al trabajo que la diferencia de otras adicciones es que se alaba y recompensa a la gente por trabajar en exceso, esto casi nunca sucede con otras adicciones.", items: [36, 45, 51, 55, 57], ranges: { bajo: range(16, 20), medio: range(10, 15), alto: range(5, 9) } },
    { code: "D8.5", parent: "D8", name: "Condiciones del Trabajo", description: "Son los factores de riesgo (condiciones de seguridad, ergonómicas, higiénico, psicosocial) que puedan afectar negativamente a la salud de los trabajadores y servidores en su actividad laboral.", items: [40, 47], ranges: { bajo: range(7, 8), medio: range(5, 6), alto: range(2, 4) } },
    { code: "D8.6", parent: "D8", name: "Doble presencia (laboral – familiar)", description: "Demandas conflictivas entre el trabajo y vida personal / familiar", items: [46, 49], ranges: { bajo: range(7, 8), medio: range(5, 6), alto: range(2, 4) } },
    { code: "D8.7", parent: "D8", name: "Estabilidad laboral y emocional", description: "Precarización laboral, incertidumbre de futuro laboral, falta de motivación o descontento en el trabajo.", items: [37, 39, 42, 52, 54], ranges: { bajo: range(16, 20), medio: range(10, 15), alto: range(5, 9) } },
    { code: "D8.8", parent: "D8", name: "Salud auto percibida", description: "Percepción respecto a la salud física y mental de la persona en relación al trabajo que realiza.", items: [44, 58], ranges: { bajo: range(7, 8), medio: range(5, 6), alto: range(2, 4) } }
  ],
  reglasPuntuacion: {
    global: {
      items: Array.from({ length: 58 }, (_, i) => i + 1),
      ranges: {
        bajo: range(175, 232),
        medio: range(117, 174),
        alto: range(58, 116)
      }
    }
  }
};
