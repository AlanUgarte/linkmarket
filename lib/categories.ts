import { Category } from './types';

/**
 * Fuente única de verdad para las categorías del sitio.
 * El "slug" debe coincidir (en minúsculas, sin tildes) con lo que se
 * escriba en la columna "Categoria" de Google Sheets, salvo las
 * categorías virtuales (ofertas del día / más vendidos) que se calculan
 * a partir de otras columnas.
 */
export const CATEGORIES: Category[] = [
  { slug: 'accesorios-para-tu-auto', nombre: 'Accesorios para tu Auto', emoji: '🚗', descripcion: 'Accesorios, cuidado y equipamiento para tu auto.', grupo: 'Auto y Moto', grupoEmoji: '🚗' },
  { slug: 'accesorios-para-tu-moto', nombre: 'Accesorios para tu Moto', emoji: '🏍️', descripcion: 'Cascos, accesorios y equipamiento para tu moto.', grupo: 'Auto y Moto', grupoEmoji: '🚗' },
  { slug: 'hogar', nombre: 'Hogar', emoji: '🏠', descripcion: 'Todo para que tu casa funcione mejor.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'living-comedor', nombre: 'Living Comedor', emoji: '🛋️', descripcion: 'Sillones, mesas y todo para tu living y comedor.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'cocina-y-bazar', nombre: 'Cocina y Bazar', emoji: '🍽️', descripcion: 'Utensilios, ollas y bazar para tu cocina.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'decoracion', nombre: 'Decoración', emoji: '🖼️', descripcion: 'Deco, cuadros y detalles para tu casa.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'muebles-de-dormitorio', nombre: 'Muebles de Dormitorio', emoji: '🛏️', descripcion: 'Camas, respaldos y muebles para el dormitorio.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'muebles-de-guardado', nombre: 'Muebles de Guardado', emoji: '🗄️', descripcion: 'Placares, cómodas, estanterías y organización.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'colchones', nombre: 'Colchones', emoji: '🛌', descripcion: 'Colchones y sommiers al mejor precio.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'iluminacion', nombre: 'Iluminación', emoji: '🔆', descripcion: 'Luces, lámparas y artefactos de iluminación.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'cortinas', nombre: 'Cortinas', emoji: '🪟', descripcion: 'Cortinas, blackout y roller para tu casa.', grupo: 'Hogar', grupoEmoji: '🏠' },
  { slug: 'aires-acondicionados', nombre: 'Aires Acondicionados', emoji: '❄️', descripcion: 'Aires acondicionados split y portátiles.', grupo: 'Electrodomésticos', grupoEmoji: '🧊' },
  { slug: 'heladeras', nombre: 'Heladeras', emoji: '🧊', descripcion: 'Heladeras y freezers al mejor precio.', grupo: 'Electrodomésticos', grupoEmoji: '🧊' },
  { slug: 'lavarropas', nombre: 'Lavarropas', emoji: '🌀', descripcion: 'Lavarropas automáticos y secarropas.', grupo: 'Electrodomésticos', grupoEmoji: '🧊' },
  { slug: 'juguetes-y-juegos', nombre: 'Juguetes y Juegos', emoji: '🧸', descripcion: 'Juguetes, juegos de mesa y diversión.' },
  { slug: 'televisores', nombre: 'Televisores', emoji: '📺', descripcion: 'Smart TVs y televisores al mejor precio.', grupo: 'Tecnología', grupoEmoji: '💡' },
  { slug: 'filmadoras-y-camaras-de-accion', nombre: 'Filmadoras y Cámaras de Acción', emoji: '📹', descripcion: 'Cámaras de acción, deportivas y filmadoras.', grupo: 'Tecnología', grupoEmoji: '💡' },
  { slug: 'auriculares', nombre: 'Auriculares', emoji: '🎧', descripcion: 'Auriculares inalámbricos, in-ear y gamer.', grupo: 'Tecnología', grupoEmoji: '💡' },
  { slug: 'celulares', nombre: 'Celulares', emoji: '📱', descripcion: 'Celulares y accesorios al mejor precio.' },
  { slug: 'computacion', nombre: 'Computación', emoji: '💻', descripcion: 'PC armadas, componentes, monitores y periféricos.' },
  { slug: 'alimento-para-mascotas', nombre: 'Alimento para Mascotas', emoji: '🦴', descripcion: 'Alimento balanceado para perros y gatos.', grupo: 'Mascotas', grupoEmoji: '🐶' },
  { slug: 'accesorios-para-mascotas', nombre: 'Accesorios para Mascotas', emoji: '🐾', descripcion: 'Camas, juguetes, correas y más para tu mascota.', grupo: 'Mascotas', grupoEmoji: '🐶' },
  { slug: 'herramientas', nombre: 'Herramientas', emoji: '🛠', descripcion: 'Herramientas profesionales al mejor precio.', grupo: 'Herramientas', grupoEmoji: '🛠' },
  { slug: 'herramientas-electricas', nombre: 'Herramientas Eléctricas', emoji: '⚡', descripcion: 'Taladros, amoladoras y herramientas eléctricas.', grupo: 'Herramientas', grupoEmoji: '🛠' },
  { slug: 'set-herramientas', nombre: 'Set Herramientas', emoji: '🧰', descripcion: 'Sets, maletines y kits completos de herramientas.', grupo: 'Herramientas', grupoEmoji: '🛠' },
  { slug: 'herramientas-para-jardin', nombre: 'Herramientas para Jardín', emoji: '🌱', descripcion: 'Todo para el jardín: corte, poda y riego.', grupo: 'Herramientas', grupoEmoji: '🛠' },
  { slug: 'gaming', nombre: 'Gaming', emoji: '🎮', descripcion: 'Setup, periféricos y accesorios gamer.' },
  { slug: 'coches', nombre: 'Coches de Bebé', emoji: '🍼', descripcion: 'Cochecitos y sillas para bebés.', grupo: 'Bebés', grupoEmoji: '👶' },
  { slug: 'butacas-y-huevito', nombre: 'Butacas y Huevito', emoji: '💺', descripcion: 'Butacas de auto y huevitos para bebés.', grupo: 'Bebés', grupoEmoji: '👶' },
  { slug: 'cuarto-del-bebe', nombre: 'Cuarto del Bebé', emoji: '🛏️', descripcion: 'Cunas, colechos y todo para el cuarto del bebé.', grupo: 'Bebés', grupoEmoji: '👶' },
  { slug: 'juguetes-de-bebes', nombre: 'Juguetes de Bebés', emoji: '🧸', descripcion: 'Sonajeros, mordillos y juguetes de estimulación.', grupo: 'Bebés', grupoEmoji: '👶' },
  { slug: 'deportes', nombre: 'Deportes', emoji: '🏃', descripcion: 'Equipamiento para moverte mejor.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'bicicletas', nombre: 'Bicicletas', emoji: '🚴', descripcion: 'Bicicletas urbanas, MTB y rodados para todos.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'fitness', nombre: 'Fitness', emoji: '💪', descripcion: 'Pesas, bandas y equipamiento para entrenar.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'padel-y-tenis', nombre: 'Pádel y Tenis', emoji: '🎾', descripcion: 'Paletas, raquetas y accesorios de pádel y tenis.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'futbol', nombre: 'Fútbol', emoji: '⚽', descripcion: 'Pelotas, botines y todo para el fútbol.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'zapas-deportivas', nombre: 'Zapas Deportivas', emoji: '👟', descripcion: 'Zapatillas deportivas y running.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'ropa-deportiva', nombre: 'Ropa Deportiva', emoji: '🎽', descripcion: 'Indumentaria para entrenar y competir.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'pesca', nombre: 'Pesca', emoji: '🎣', descripcion: 'Cañas, reels y equipamiento de pesca.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'boxeo', nombre: 'Boxeo', emoji: '🥊', descripcion: 'Guantes, bolsas y equipamiento de boxeo.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'camping', nombre: 'Camping', emoji: '🏕️', descripcion: 'Carpas, bolsas de dormir y equipo de camping.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'yoga-y-pilates', nombre: 'Yoga y Pilates', emoji: '🧘', descripcion: 'Mats, bandas y accesorios de yoga y pilates.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'termos-y-vasos', nombre: 'Termos y Vasos', emoji: '🧉', descripcion: 'Termos, vasos térmicos y botellas.', grupo: 'Deportes y Fitness', grupoEmoji: '🏃' },
  { slug: 'perfumes-hombre', nombre: 'Perfumes Hombre', emoji: '🧔', descripcion: 'Fragancias masculinas originales al mejor precio.', grupo: 'Perfumes', grupoEmoji: '🧴' },
  { slug: 'perfumes-mujer', nombre: 'Perfumes Mujer', emoji: '👩', descripcion: 'Fragancias femeninas originales al mejor precio.', grupo: 'Perfumes', grupoEmoji: '🧴' },
  { slug: 'maquillaje', nombre: 'Maquillaje', emoji: '💄', descripcion: 'Maquillaje y cosmética al mejor precio.', grupo: 'Belleza y Cuidado Personal', grupoEmoji: '💄' },
  { slug: 'cuidado-de-la-piel', nombre: 'Cuidado de la Piel', emoji: '🧴', descripcion: 'Cremas, serums y cuidado facial y corporal.', grupo: 'Belleza y Cuidado Personal', grupoEmoji: '💄' },
  { slug: 'electrobeauty', nombre: 'Electrobeauty', emoji: '💇‍♀️', descripcion: 'Planchitas, secadores y aparatología de belleza.', grupo: 'Belleza y Cuidado Personal', grupoEmoji: '💄' },
  { slug: 'cuidado-del-cabello', nombre: 'Cuidado del Cabello', emoji: '💆‍♀️', descripcion: 'Shampoo, tratamientos y cuidado capilar.', grupo: 'Belleza y Cuidado Personal', grupoEmoji: '💄' },
  { slug: 'dermocosmetica', nombre: 'Dermocosmética', emoji: '🧪', descripcion: 'Dermocosmética y cuidado especializado de la piel.', grupo: 'Belleza y Cuidado Personal', grupoEmoji: '💄' },
  { slug: 'belleza-profesional', nombre: 'Belleza Profesional', emoji: '💅', descripcion: 'Productos y equipamiento de belleza profesional.', grupo: 'Belleza y Cuidado Personal', grupoEmoji: '💄' },
  { slug: 'suplementos', nombre: 'Suplementos', emoji: '💊', descripcion: 'Proteínas, creatina, vitaminas y suplementos.', grupo: 'Salud', grupoEmoji: '🩺' },
  {
    slug: 'ofertas-del-dia',
    nombre: 'Ofertas del día',
    emoji: '🔥',
    descripcion: 'Los descuentos más fuertes, elegidos hoy.',
    virtual: 'ofertas',
  },
  {
    slug: 'mas-vendidos',
    nombre: 'Más vendidos',
    emoji: '⭐',
    descripcion: 'Los productos que la gente más está comprando.',
    virtual: 'masVendidos',
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const NAV_CATEGORIES = CATEGORIES.filter((c) => !c.virtual);
export const FEATURED_CATEGORIES = CATEGORIES.filter((c) => c.virtual);
