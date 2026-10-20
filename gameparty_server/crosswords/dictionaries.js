// server/crosswords/dictionaries.js
// Gran enciclopedia de palabras clasificadas con pistas claras e imágenes ilustrativas

const WORDS_DATABASE = [
  // --- ASTRONOMÍA Y COSMOS ---
  { word: "SOL", clue: "Estrella luminosa en el centro de nuestro sistema planetario", image: "https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "LUNA", clue: "Satélite natural que orbita alrededor de la Tierra", image: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "MARTE", clue: "Cuarto planeta del sistema solar conocido como el planeta rojo", image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "TIERRA", clue: "Tercer planeta desde el Sol y hogar de la humanidad", image: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "geografia", "general"] },
  { word: "VENUS", clue: "Segundo planeta del sistema solar, el más brillante en el firmamento", image: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "JUPITER", clue: "Planeta gigante gaseoso, el más grande del sistema solar", image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "SATURNO", clue: "Planeta famoso por su espectacular sistema de anillos brillantes", image: "https://images.unsplash.com/photo-1614732484003-ef9881555dc3?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "URANO", clue: "Séptimo planeta del sistema solar de característico tono azul verdoso", image: "https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "NEPTUNO", clue: "Planeta más lejano del Sol, gigante helado de color azul intenso", image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "GALAXIA", clue: "Enorme conjunto de estrellas, planetas y gas unidos por gravedad", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "PLANETA", clue: "Cuerpo celeste denso que orbita alrededor de una estrella", image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "COMETA", clue: "Astro helado que al acercarse al Sol genera una brillante cabellera y cola", image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "ASTEROIDE", clue: "Cuerpo rocoso más pequeño que un planeta que orbita en el espacio", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "ORBITA", clue: "Trayectoria curva regular que describe un astro alrededor de otro", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "ECLIPSE", clue: "Ocultación transitoria de un astro por interposición de otro cuerpo celeste", image: "https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "NEBULOSA", clue: "Gigantesca nube interestelar compuesta de gas y polvo cósmico", image: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "METEORO", clue: "Fenómeno luminoso en la atmósfera producido por la entrada de un meteoroide", image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "COSMOS", clue: "El universo considerado como un todo ordenado y armónico", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },

  // --- GEOGRAFÍA Y PAISAJES ---
  { word: "AMAZONAS", clue: "Río más caudaloso y largo del planeta situado en Sudamérica", image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "NILO", clue: "Gran río africano junto al que floreció la antigua civilización egipcia", image: "https://images.unsplash.com/photo-1578922746465-3a80a228f223?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "DANUBIO", clue: "Segundo río más largo de Europa que atraviesa diez países distintos", image: "https://images.unsplash.com/photo-1509299349698-dd22323b5963?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "EVEREST", clue: "Montaña más alta de la Tierra situada en la cordillera del Himalaya", image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "ANDES", clue: "Cadena montañosa continua más larga del mundo que recorre Sudamérica", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "ALPES", clue: "Importante cordillera montañosa situada en Europa Central", image: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "SAHARA", clue: "El desierto cálido más extenso del mundo situado en el norte de África", image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "OCEANO", clue: "Gran masa continua de agua salada que cubre tres cuartas partes del globo", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "VOLCAN", clue: "Abertura en la corteza terrestre por donde brota magma, lava y ceniza", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "ciencia", "general"] },
  { word: "DESIERTO", clue: "Región geográfica con escasas precipitaciones y clima árido extremo", image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "SELVA", clue: "Bosque tropical denso y húmedo con abundante vegetación y fauna", image: "https://images.unsplash.com/photo-1511497584788-87676104235f?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "BOSQUE", clue: "Ecosistema poblado predominantemente por árboles y sotobosque", image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "GLACIAR", clue: "Gruesa masa de hielo permanente que se desplaza lentamente por un valle", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "CASCADA", clue: "Caída vertical y abrupta de una corriente de agua desde gran altura", image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "ISLA", clue: "Porción de tierra completamente rodeada por agua", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "ARCHIPIELAGO", clue: "Conjunto de islas agrupadas en una misma zona marítima", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "PENINSULA", clue: "Extensión de tierra rodeada de agua por todas partes excepto por un istmo", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "VALLE", clue: "Llanura situada entre montañas por donde habitualmente discurre un río", image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "CORDILLERA", clue: "Sucesión continua o cadena alineada de montañas elevadas", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "OASIS", clue: "Paraje con vegetación y agua dulce aislado en medio de un desierto", image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "CANAL", clue: "Vía de agua artificial construida para la navegación o el regadío", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "FIORDO", clue: "Golfo estrecho y profundo formado por la inundación de un valle glaciar", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "CRATER", clue: "Boca o abertura en la cima de un volcán o producida por un meteorito", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "ciencia", "general"] },
  { word: "ACANTILADO", clue: "Costa rocosa escarpada cortada casi verticalmente sobre el mar", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },

  // --- CIUDADES Y MARAVILLAS ---
  { word: "MADRID", clue: "Capital y ciudad más poblada de España en el centro de la península", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "PARIS", clue: "Capital de Francia mundialmente célebre por la Torre Eiffel y el Sena", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "ROMA", clue: "Capital de Italia conocida como la Ciudad Eterna por sus monumentos milenarios", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "TOKIO", clue: "Metrópoli futurista y bulliciosa capital de Japón", image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "BERLIN", clue: "Capital de Alemania marcada históricamente por su famoso muro", image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "LONDRES", clue: "Capital del Reino Unido situada a orillas del río Támesis", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "ATENAS", clue: "Cuna de la democracia occidental y capital histórica de Grecia", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "ELCAIRO", clue: "Mayor metrópoli de Egipto y del mundo árabe situada junto al Nilo", image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },

  // --- ANIMALES Y FAUNA ---
  { word: "LEON", clue: "Gran felino carnívoro de la sabana conocido como el rey de la selva", image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "TIGRE", clue: "El felino más grande del mundo con pelaje naranja a rayas negras", image: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "OSO", clue: "Mamífero omnívoro corpulento de pelaje denso y garras poderosas", image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "LOBO", clue: "Cánido salvaje de vida gregaria que aúlla y caza en manada", image: "https://images.unsplash.com/photo-1564865878688-9a244444042a?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "DELFIN", clue: "Cetáceo muy inteligente que nada en mares y respira por espiráculo", image: "https://images.unsplash.com/photo-1607153333879-c1a07d30ac04?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "BALLENA", clue: "El animal más gigantesco del océano, mamífero marino con barbas o dientes", image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "AGUILA", clue: "Ave rapaz diurna de vista prodigiosa, pico ganchudo y garras fuertes", image: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "HALCON", clue: "Ave rapaz famosa por su vuelo en picado a velocidades extremas", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "CONDOR", clue: "Una de las aves voladoras más grandes del mundo típica de los Andes", image: "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "ELEFANTE", clue: "El mamífero terrestre más grande del mundo dotado de trompa prensil", image: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "JIRAFA", clue: "Mamífero rumiante africano que posee el cuello más largo del reino animal", image: "https://images.unsplash.com/photo-1538099130811-745e64318258?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "CEBRA", clue: "Équido salvaje africano con un característico pelaje a rayas blancas y negras", image: "https://images.unsplash.com/photo-1501705388883-4ed8a543392c?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "CAMALEON", clue: "Reptil conocido por sus ojos independientes y su habilidad de cambiar de color", image: "https://images.unsplash.com/photo-1568644396922-5c3bfae12521?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "PINGUINO", clue: "Ave marina no voladora adaptada al frío polar que nada velozmente", image: "https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "TIBURON", clue: "Pez cartilaginoso depredador con aleta dorsal triangular y afilados dientes", image: "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "PULPO", clue: "Molusco marino provisto de ocho tentáculos con ventosas y gran inteligencia", image: "https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "KOALA", clue: "Marsupial arborícola australiano que se alimenta de hojas de eucalipto", image: "https://images.unsplash.com/photo-1459262838948-3e24331ff6ea?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "PANDA", clue: "Oso originario de los bosques de bambú de China de pelaje blanco y negro", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef6?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "BUHO", clue: "Ave rapaz nocturna con grandes ojos frontales y vuelo silencioso", image: "https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "CASTOR", clue: "Roedor semiacuático conocido por construir presas y diques de madera", image: "https://images.unsplash.com/photo-1579380656108-328e804f86ae?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "CANGURO", clue: "Marsupial herbívoro de Australia que se desplaza dando grandes saltos", image: "https://images.unsplash.com/photo-1501705388883-4ed8a543392c?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "CAMELLO", clue: "Mamífero adaptado al desierto con jorobas donde almacena tejido graso", image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "GORILA", clue: "El más grande de los primates herbívoros que habita en las selvas de África", image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "ARDILLA", clue: "Pequeño roedor ágil de cola peluda que recolecta nueces y piñas", image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "MARIPOSA", clue: "Insecto volador con alas coloridas cubiertas de finas escamas", image: "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "ABEJA", clue: "Insecto polinizador social que vive en colmenas y fabrica cera y miel", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "FLAMENCO", clue: "Ave zancuda acuática de patas largas y vistoso plumaje rosado", image: "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },
  { word: "COLIBRI", clue: "Diminuta ave americana de vuelo suspendido que liba néctar con su pico fino", image: "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=600&auto=format&fit=crop&q=80", tags: ["animales", "general"] },

  // --- CIENCIA, MEDICINA Y TECNOLOGÍA ---
  { word: "ATOMO", clue: "Unidad básica fundamental que compone toda la materia química", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "CELULA", clue: "Unidad microscópica morfológica y funcional de todo ser vivo", image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "ENERGIA", clue: "Capacidad que poseen los cuerpos para realizar un trabajo o producir cambios", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "GRAVEDAD", clue: "Fuerza de atracción mutua que actúa entre todos los objetos con masa", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "MAGNETISMO", clue: "Propiedad física por la que los imanes ejercen atracción o repulsión", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "FOSIL", clue: "Resto petrificado de un organismo del pasado conservado en estratos rocosos", image: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "MICROSCOPIO", clue: "Instrumento óptico para ampliar y observar objetos diminutos", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "TELESCOPIO", clue: "Instrumento óptico para observar astros lejanos en el firmamento", image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "TERMOMETRO", clue: "Dispositivo empleado para medir con exactitud la temperatura", image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "SATELITE", clue: "Artefacto artificial lanzado al espacio para telecomunicaciones o clima", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "SUBMARINO", clue: "Embarcación blindada capaz de navegar sumergida bajo el agua", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "ROBOT", clue: "Máquina programable automática diseñada para ejecutar tareas complejas", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "BATERIA", clue: "Dispositivo que almacena energía química para transformarla en eléctrica", image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "CORAZON", clue: "Órgano muscular central que bombea sangre por todo el organismo", image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "CEREBRO", clue: "Órgano del sistema nervioso central que rige el pensamiento y la memoria", image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "RADAR", clue: "Sistema que usa ondas electromagnéticas para localizar objetos a distancia", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "VACUNA", clue: "Preparado biológico que estimula la inmunidad contra enfermedades infecciosas", image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "LASER", clue: "Dispositivo que amplifica y emite un haz de luz coherente y concentrado", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },
  { word: "INTERNET", clue: "Red informática mundial descentralizada de comunicación y datos", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80", tags: ["ciencia", "general"] },

  // --- ARTE, MÚSICA Y ESPECTÁCULO ---
  { word: "GUITARRA", clue: "Instrumento musical de cuerda que suele tener seis cuerdas de nailon o acero", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "PIANO", clue: "Instrumento musical de teclado y cuerdas percutidas por macillos", image: "https://images.unsplash.com/photo-1520523839898-50712128e469?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "VIOLIN", clue: "Instrumento musical de cuatro cuerdas que se toca frotándolas con un arco", image: "https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "FLAUTA", clue: "Instrumento musical de viento en forma de tubo perforado con bisel", image: "https://images.unsplash.com/photo-1520523839898-50712128e469?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "TROMPETA", clue: "Instrumento de viento metal con boquilla semiesférica y tres pistones", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "ARPA", clue: "Instrumento musical triangular con marco vertical de numerosas cuerdas", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "CINE", clue: "Arte y técnica de narrar historias proyectando fotogramas en movimiento", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "TEATRO", clue: "Rama de las artes escénicas donde los actores representan historias ante público", image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "OPERA", clue: "Obra teatral cantada enteramente con acompañamiento de orquesta sinfónica", image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "PINTURA", clue: "Arte de representar figuras o ideas aplicando pigmentos sobre una superficie", image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "ESCULTURA", clue: "Arte de modelar, tallar o esculpir figuras tridimensionales en piedra o metal", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "POESIA", clue: "Manifestación de la belleza o sentimiento por medio de la palabra rimada o verso", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "NOVELA", clue: "Obra literaria en prosa extensa que narra una trama ficticia con personajes", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "DANZA", clue: "Expresión corporal artística realizada siguiendo el ritmo de la música", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "LIENZO", clue: "Tela resistente tensada sobre bastidor que sirve de soporte para pintar", image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "MUSEO", clue: "Institución abierta al público que conserva y exhibe colecciones de valor cultural", image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "TAMBOR", clue: "Instrumento musical de percusión formado por una membrana tensada sobre un cilindro", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "CLARINETE", clue: "Instrumento de viento madera con boquilla de lengüeta simple y orificios con llaves", image: "https://images.unsplash.com/photo-1520523839898-50712128e469?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },
  { word: "SAXOFON", clue: "Instrumento musical cónico de viento metal con boquilla de caña", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80", tags: ["arte", "general"] },

  // --- HISTORIA Y CIVILIZACIONES ---
  { word: "CASTILLO", clue: "Edificación medieval fortificada con murallas, almenas y torres de defensa", image: "https://images.unsplash.com/photo-1524397031866-0a02c3ecd78b?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "PIRAMIDE", clue: "Monumento funerario de base poligonal y caras triangulares típico de Egipto", image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "FARAON", clue: "Título supremo otorgado a los soberanos reyes del Antiguo Egipto", image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "GLADIADOR", clue: "Combatiente de la Antigua Roma que luchaba en la arena de los anfiteatros", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "IMPERIO", clue: "Organización política en la que un Estado domina a diversos pueblos o territorios", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "CABALLERO", clue: "Guerrero a caballo de la nobleza medieval que seguía un código de honor", image: "https://images.unsplash.com/photo-1524397031866-0a02c3ecd78b?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "MURALLA", clue: "Muro defensivo alto y resistente que rodea una fortaleza o ciudad antigua", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "CORONA", clue: "Aro enjoyado colocado sobre la cabeza como insignia de dignidad real", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "ESCUDO", clue: "Arma defensiva usada para proteger el cuerpo de golpes y flechas", image: "https://images.unsplash.com/photo-1524397031866-0a02c3ecd78b?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "ESPADA", clue: "Arma blanca de hoja recta y filo de acero con guarnición y empuñadura", image: "https://images.unsplash.com/photo-1524397031866-0a02c3ecd78b?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },
  { word: "TEMPLO", clue: "Edificio sagrado destinado exclusivamente al culto religioso de una deidad", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", tags: ["historia", "general"] },

  // --- OBJETOS COTIDIANOS Y HERRAMIENTAS ---
  { word: "BRUJULA", clue: "Instrumento de navegación provisto de aguja imantada que marca el rumbo norte", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "RELOJ", clue: "Aparato que mide y señala el paso del tiempo en horas, minutos y segundos", image: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "ESPEJO", clue: "Superficie pulida que refleja las imágenes de los objetos que tiene delante", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "LINTERNA", clue: "Aparato portátil con luz eléctrica alimentado a pilas o batería", image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "CANDADO", clue: "Dispositivo de seguridad cerrado con llave que bloquea puertas o cofres", image: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "LLAVE", clue: "Pieza de metal con muescas que sirve para accionar la cerradura de una puerta", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "MAPA", clue: "Representación gráfica plana y a escala de la Tierra o parte de ella", image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80", tags: ["geografia", "general"] },
  { word: "LIBRO", clue: "Conjunto de hojas de papel encuadernadas que forman un volumen impreso", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "BALANZA", clue: "Instrumento utilizado para pesar objetos comparando masas", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "TIJERAS", clue: "Herramienta manual de corte formada por dos hojas cruzadas que giran en un eje", image: "https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "MARTILLO", clue: "Herramienta de percusión con mango y cabeza de metal para clavar clavos", image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "ANCLA", clue: "Pieza pesada de hierro colgada de un barco para sujetarlo al fondo del mar", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "PARAGUAS", clue: "Utensilio plegable de tela impermeable que protege de la lluvia", image: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "TIMON", clue: "Pieza articulada en la popa de una embarcación que permite dirigir su rumbo", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", tags: ["general"] },

  // --- GASTRONOMÍA Y ALIMENTOS ---
  { word: "CHOCOLATE", clue: "Alimento dulce elaborado con pasta y manteca de granos de cacao", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "CAFE", clue: "Bebida estimulante elaborada por infusión de granos tostados y molidos", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "CANELA", clue: "Especia aromática de corteza vegetal secada en ramas de color marrón", image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "VAINILLA", clue: "Aroma y especia dulce obtenido de la vaina de una orquídea tropical", image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "MIEL", clue: "Sustancia dulce y viscosa producida por las abejas a partir del néctar floral", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "AZUCAR", clue: "Sustancia cristalina blanca extraída de la caña o la remolacha para endulzar", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "PAN", clue: "Alimento básico tradicional horneado con harina de trigo, agua y levadura", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "QUESO", clue: "Producto lácteo obtenido por maduración y cuajado de la leche", image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "MANZANA", clue: "Fruta redonda y crujiente de pulpa blanca con piel roja, verde o amarilla", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "NARANJA", clue: "Fruta cítrica redonda rica en vitamina C de pulpa jugosa dividida en gajos", image: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "LIMON", clue: "Cítrico amarillo de sabor intensamente ácido utilizado para sazonar", image: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "ALMENDRA", clue: "Fruto seco ovalado con cáscara dura muy empleado en confitería y turrón", image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "ACEITUNA", clue: "Fruto del olivo del cual se extrae el apreciado aceite de oliva virgen", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "ARROZ", clue: "Cereal blanco alimentario cultivado en arrozales, base de dietas mundiales", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80", tags: ["general"] },

  // --- DEPORTES Y DESTREZAS ---
  { word: "FUTBOL", clue: "Deporte de once contra once donde se busca meter el balón en la portería", image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "TENIS", clue: "Deporte de raqueta jugado sobre una pista rectangular dividida por una red", image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "GOLF", clue: "Deporte de precisión en el que se golpea una bola con palos hacia hoyos en el césped", image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "BOXEO", clue: "Deporte de combate en el que dos púgiles pelean usando guantes en un cuadrilátero", image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "ESGRIMA", clue: "Deporte de combate con armas blancas como florete, espada y sable", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "NATACION", clue: "Deporte consistente en desplazarse y avanzar en el agua mediante brazadas", image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "ATLETISMO", clue: "Conjunto de disciplinas deportivas que incluye carreras, saltos y lanzamientos", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "CICLISMO", clue: "Deporte que se disputa sobre una bicicleta en ruta o velódromo", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "AJEDREZ", clue: "Juego de estrategia sobre tablero de 64 casillas donde el objetivo es el jaque mate", image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&auto=format&fit=crop&q=80", tags: ["general"] },
  { word: "MARATON", clue: "Carrera de atletismo de resistencia sobre una distancia mítica de 42,195 km", image: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=600&auto=format&fit=crop&q=80", tags: ["general"] }
];

const DICTIONARIES = {
  todo_tipo: {
    name: "De Todo Tipo (Cultura Universal)",
    icon: "Sparkles",
    cover: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=600&auto=format&fit=crop&q=80",
    description: "Crucigrama 15x15 con conceptos variados de ciencia, arte, historia, geografía y vida diaria.",
    words: WORDS_DATABASE
  },

  general: {
    name: "Cultura General",
    icon: "Globe",
    cover: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=600&auto=format&fit=crop&q=80",
    description: "Historia, maravillas, inventos y conocimientos generales.",
    words: WORDS_DATABASE
  },

  animales: {
    name: "Animales y Fauna",
    icon: "Trees",
    cover: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&auto=format&fit=crop&q=80",
    description: "Mamíferos, aves rapaces, criaturas del mar y fauna salvaje.",
    words: WORDS_DATABASE.filter(w => w.tags.includes("animales"))
  },

  ciencia: {
    name: "Ciencia y Espacio",
    icon: "Cpu",
    cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    description: "Astronomía, física, inventos, medicina y tecnología.",
    words: WORDS_DATABASE.filter(w => w.tags.includes("ciencia"))
  },

  geografia: {
    name: "Viajes y Geografía",
    icon: "Compass",
    cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    description: "Ríos, montañas, continentes, islas y capitales del mundo.",
    words: WORDS_DATABASE.filter(w => w.tags.includes("geografia"))
  },

  arte: {
    name: "Arte, Cine y Música",
    icon: "Palette",
    cover: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    description: "Pintura, cine, instrumentos musicales y expresiones artísticas.",
    words: WORDS_DATABASE.filter(w => w.tags.includes("arte"))
  },

  historia: {
    name: "Historia y Civilizaciones",
    icon: "Crown",
    cover: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80",
    description: "Imperios, faraones, caballeros, fortalezas y mitos del pasado.",
    words: WORDS_DATABASE.filter(w => w.tags.includes("historia"))
  }
};

module.exports = { DICTIONARIES };
