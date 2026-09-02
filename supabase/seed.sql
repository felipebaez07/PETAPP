-- Datos de ejemplo (demo/seed) para el directorio piloto.
-- A diferencia de la primera versión (aliados 100% ficticios), estos son negocios y
-- organizaciones REALES de Ibagué encontrados por investigación de mercado (ver
-- docs/CANDIDATOS_ALIADOS_IBAGUE.md para fuentes y nivel de confianza de cada uno).
--
-- IMPORTANTE: ninguno ha sido contactado ni ha dado su consentimiento para aparecer
-- como aliado de PetApp — por eso TODOS quedan con verification_status = 'pendiente',
-- sin importar qué tan sólida sea la fuente. is_active = true para que se vean en el
-- directorio público (marcados como "pendiente de verificación"), pero el equipo del
-- piloto debe contactarlos y confirmarlos de verdad antes de tratarlos como aliados
-- reales. No se crean publicaciones de adopción para las fundaciones reales incluidas
-- aquí: inventar animales disponibles bajo el nombre de una fundación real tergiversaría
-- su operación actual, así que esas deben venir de la fundación una vez contactada.
--
-- Limpia cualquier dato de seed anterior (incluye, por CASCADE, horarios/servicios/
-- solicitudes de cita que dependan de estas filas).
--
-- `adoption_photos`/`adoption_posts` salieron de este truncate el 2026-09-02: la migración
-- 0005_pivot_preventivo.sql las renombró a `zz_deprecated_*` (pivot de producto, ver
-- spec.md sección 2), así que `supabase db reset` (migraciones + este seed) fallaba con
-- "relation \"public.adoption_photos\" does not exist" antes de sembrar nada.
truncate table
  public.services,
  public.establishment_hours,
  public.establishments
cascade;

insert into public.establishments
  (id, name, slug, category, description, address, city, phone, whatsapp_number, is_24_7, is_active, verification_status, verified_at)
values
  -- Veterinarias y farmacia veterinaria
  ('10000000-0000-4000-a000-000000000001', 'Central de Urgencias Veterinarias', 'central-de-urgencias-veterinarias', 'veterinaria',
   'Atención de urgencias veterinarias las 24 horas, todos los días.',
   'Av. Ferrocarril #30-121, Barrio Cádiz', 'Ibagué', null, '573133216290', true, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000002', 'Clínica Veterinaria del Tolima', 'clinica-veterinaria-del-tolima', 'veterinaria',
   'Consulta general de medicina veterinaria.',
   'Carrera 6 #30-21, Barrio Carmenza Rocha', 'Ibagué', '6082645638', null, false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000003', 'TODOVET Clínica Veterinaria', 'todovet-clinica-veterinaria', 'veterinaria',
   'Hospital veterinario completo: hospitalización, cirugías, laboratorio, rayos X, guardería, belleza canina y urgencias 24 horas.',
   'Carrera 5, Calle 78, Manzana 13 Casa 15, 6ª Etapa El Jordán', 'Ibagué', '6082672167', '573054007417', true, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000004', 'Emergencias Veterinarias del Tolima', 'emergencias-veterinarias-del-tolima', 'veterinaria',
   'Clínica de atención continua: consulta, hospitalización, cirugía, rayos X, laboratorio, vacunación y peluquería canina/felina.',
   'Av. Guabinal #41-76, Barrio Calarcá', 'Ibagué', '573105008908', '573105008908', true, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000005', 'Canimedic Centro Médico Canino', 'canimedic-centro-medico-canino', 'veterinaria',
   'Medicina interna, cirugía, rayos X, ortopedia, ecografía y odontología para pequeños animales.',
   'Carrera 11 #4-59, Barrio Belén', 'Ibagué', '6082732521', null, false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000006', 'Huellas Unidad Médica Veterinaria', 'huellas-unidad-medica-veterinaria', 'veterinaria',
   'Consultas, vacunación, ecografía, laboratorio clínico y farmacia veterinaria.',
   'Carrera 6 #53-09, Local 3', 'Ibagué', '6082666672', '573167597540', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000007', 'Hospital Veterinario — Universidad del Tolima', 'hospital-veterinario-universidad-del-tolima', 'veterinaria',
   'Hospital veterinario académico: medicina de pequeños y grandes animales, oncología, oftalmología, exóticos, cirugía, imágenes diagnósticas y laboratorio. Atención 24/7.',
   'Calle 20 Sur #23a-160, Barrio Miramar, Sede Sur Universidad del Tolima', 'Ibagué', '573204240394', '573244321569', true, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000008', 'Veterinaria Supermascotas', 'veterinaria-supermascotas', 'veterinaria',
   'Consulta general, hospitalización, guardería y peluquería.',
   'Av. Guabinal, Etapa 8, Manzana 20 Casa 10, Barrio Jordán Octava Etapa', 'Ibagué', '6082713626', null, false, true, 'pendiente', null),

  -- Petshops, accesorios, cosméticos y estética
  ('10000000-0000-4000-a000-000000000009', 'Freya''s Land Tienda de Mascotas', 'freyas-land-tienda-de-mascotas', 'comercio',
   'Boutique de mascotas: alimento, snacks, ropa y accesorios, kits de cumpleaños, y baño/spa sin estrés.',
   'Local 11, Santafé de Varsovia, Carrera 6 Sur #66-40', 'Ibagué', '573508016913', '573508016913', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000010', 'Zooshop', 'zooshop-ibague', 'comercio',
   'Tienda de mascotas con concentrados, snacks, ropa, accesorios, medicamentos veterinarios y vacunación.',
   'Carrera 7 #57-129, Local 2', 'Ibagué', '573138887108', '573138887108', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000011', 'Kewao', 'kewao', 'comercio',
   'Supermercado de mascotas de gran formato, con sede boutique en Palos Verdes (Calle 93 #9-02, Local 2).',
   'Calle 67 #6-30, Torre Oporto', 'Ibagué', null, null, false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000012', 'Central Pecuaria Mascotas', 'central-pecuaria-mascotas', 'comercio',
   'Alimento y accesorios para mascotas, más servicios veterinarios (rayos X, ecografía, laboratorio) y peluquería.',
   'Carrera 5 #39-02', 'Ibagué', '6082596528', '573107560490', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000013', 'PETSHOME', 'petshome', 'comercio',
   'Tienda de mascotas dentro del Centro Comercial La Estación.',
   'Local P-11 (Calle 60 #12-225), Centro Comercial La Estación', 'Ibagué', '573025423024', '573025423024', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000014', 'Boutique Vanidad Canina Pet Shop', 'boutique-vanidad-canina-pet-shop', 'comercio',
   'Boutique de mascotas y servicios veterinarios en el Paseo del Vergel.',
   'Av. Ambalá, Paseo del Vergel, Local 6', 'Ibagué', '6082688080', null, false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000015', 'La Tienda de Terry', 'la-tienda-de-terry', 'comercio',
   'Alimento, snacks, juguetes, jaulas y terrarios para mascotas y gatos.',
   null, 'Ibagué', '573507820130', '573507820130', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000016', 'Pet Grooming', 'pet-grooming-ibague', 'comercio',
   'Baño medicado, limpieza de oídos, corte de uñas y estilizado con tijera; especializado en Shih Tzu, Yorkshire y Pomerania.',
   'Calle 58 #6-43, Barrio Limonar', 'Ibagué', null, null, false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000017', 'Hapiness Pet Shop', 'hapiness-pet-shop', 'comercio',
   'Tienda de mascotas con servicio de peluquería canina y academia de peluquería.',
   null, 'Ibagué', '573187936286', '573187936286', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000018', 'Pet Club Spa', 'pet-club-spa', 'comercio',
   'Servicio de estética y spa canino-felino en el centro de Ibagué.',
   'Edificio Mediterráneo, Carrera 2 #7-22', 'Ibagué', null, null, false, true, 'pendiente', null),

  -- Profesionales independientes
  ('10000000-0000-4000-a000-000000000019', 'Kelev911', 'kelev911', 'profesional',
   'Servicio veterinario a domicilio 24/7: consultas, urgencias, ambulancia, vacunación, ecografía, radiografía y laboratorio.',
   'Atención a domicilio, Ibagué', 'Ibagué', '573153334370', '573153334370', true, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000020', 'Veterinaria ClinicPets — Dra. Sofía Ortegón', 'clinicpets-sofia-ortegon', 'profesional',
   'Veterinaria a domicilio: consultas, vacunación, desparasitación, esterilización y cirugía menor.',
   'Entre Ríos 2ª etapa, Manzana K Casa 2 (atención a domicilio)', 'Ibagué', '573165498841', '573165498841', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000021', 'ZOOCARE', 'zoocare-ibague', 'profesional',
   'Servicio de atención veterinaria a domicilio en Ibagué; también ofrece paseo y peluquería.',
   'Atención a domicilio, Ibagué', 'Ibagué', null, null, false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000022', '"Un Perro Adiestrado, es un Amo Feliz" — Olga Patricia Gómez Botia', 'un-perro-adiestrado-es-un-amo-feliz', 'profesional',
   'Adiestramiento canino a domicilio: curso de obediencia y comportamiento de 10 sesiones con refuerzo positivo.',
   'Atención a domicilio, Ibagué', 'Ibagué', '573152856928', '573012882387', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000023', 'Guardería Campestre La Martinica', 'guarderia-campestre-la-martinica', 'profesional',
   'Guardería y colegio canino campestre de 50.000 m², con asistencia veterinaria en el sitio.',
   'Km 3, Variante Ibagué–Armenia', 'Ibagué', '573137041002', '573137041002', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000024', 'Guardería Canina Montverde', 'guarderia-canina-montverde', 'profesional',
   'Guardería canina enfocada en bienestar animal, con espacio para que los perros jueguen bajo supervisión.',
   'Parte Alta, Barrio San Antonio–Ambalá', 'Ibagué', '573122999794', '573122999794', false, true, 'pendiente', null),

  -- Fundaciones y rescate
  ('10000000-0000-4000-a000-000000000025', 'Fundación de Rescate Animal SOS Huellitas', 'fundacion-sos-huellitas', 'fundacion',
   'Rescate, rehabilitación y adopción de gatos y perros en Ibagué, con más de 11 años de operación.',
   'Carrera 3 #83-49 ET 2 Casa 15', 'Ibagué', '573202449127', '573202449127', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000026', 'Fundación Refugio Animal Ibagué', 'fundacion-refugio-animal-ibague', 'fundacion',
   'Refugio con más de 150 perros y gatos rescatados; realiza jornadas de esterilización y adopción.',
   'Carrera 11 #6-55, sector Belén', 'Ibagué', '573183164249', '573184191283', false, true, 'pendiente', null),

  ('10000000-0000-4000-a000-000000000027', 'Fundación Rescate Animal Ibagué', 'fundacion-rescate-animal-ibague', 'fundacion',
   'Fundación de rescate y protección animal; su representante integra la Junta de Protección Animal de Ibagué.',
   'Carrera 13 #32-98', 'Ibagué', '573182256802', '573182256802', false, true, 'pendiente', null);

insert into public.establishment_hours (establishment_id, day_of_week, open_time, close_time, closed)
select e.id, d.day_of_week,
  case when e.is_24_7 then '00:00'::time else '08:00'::time end,
  case when e.is_24_7 then '23:59'::time else '18:00'::time end,
  case when d.day_of_week = 0 and not e.is_24_7 then true else false end
from public.establishments e
cross join (select generate_series(0,6) as day_of_week) d;

-- Servicios: solo los que la propia investigación describió explícitamente para cada
-- negocio (ver docs/CANDIDATOS_ALIADOS_IBAGUE.md) — no se inventan servicios adicionales.
insert into public.services (establishment_id, name, description, price_reference)
values
  ('10000000-0000-4000-a000-000000000001', 'Urgencias 24 horas', 'Atención de urgencias veterinarias las 24 horas, todos los días.', null),
  ('10000000-0000-4000-a000-000000000003', 'Hospitalización', 'Hospitalización y cirugías con laboratorio y rayos X en el sitio.', null),
  ('10000000-0000-4000-a000-000000000003', 'Peluquería canina', 'Belleza canina y guardería.', null),
  ('10000000-0000-4000-a000-000000000004', 'Consulta y hospitalización', 'Consulta, hospitalización, cirugía, rayos X y laboratorio.', null),
  ('10000000-0000-4000-a000-000000000005', 'Cirugía y ortopedia', 'Medicina interna, cirugía, rayos X, ortopedia y ecografía.', null),
  ('10000000-0000-4000-a000-000000000006', 'Ecografía y laboratorio', 'Ecografía, ecocardiograma, electrocardiograma y laboratorio clínico.', null),
  ('10000000-0000-4000-a000-000000000007', 'Especialidades', 'Oncología, oftalmología, exóticos, cirugía e imágenes diagnósticas.', null),
  ('10000000-0000-4000-a000-000000000008', 'Guardería y peluquería', 'Guardería y peluquería para perros y gatos.', null),
  ('10000000-0000-4000-a000-000000000009', 'Baño y spa sin estrés', 'Baño y spa con enfoque de bienestar animal.', null),
  ('10000000-0000-4000-a000-000000000010', 'Vacunación', 'Vacunación y consulta veterinaria en tienda.', null),
  ('10000000-0000-4000-a000-000000000012', 'Rayos X y ecografía', 'Servicios veterinarios de diagnóstico por imagen y laboratorio.', null),
  ('10000000-0000-4000-a000-000000000016', 'Baño y corte con tijera', 'Baño medicado, limpieza de oídos, corte de uñas y estilizado con tijera.', null),
  ('10000000-0000-4000-a000-000000000017', 'Peluquería canina', 'Servicio de peluquería canina.', null),
  ('10000000-0000-4000-a000-000000000018', 'Spa canino-felino', 'Estética y spa para perros y gatos.', null),
  ('10000000-0000-4000-a000-000000000019', 'Consulta a domicilio 24/7', 'Consultas, urgencias, vacunación y laboratorio a domicilio.', null),
  ('10000000-0000-4000-a000-000000000020', 'Consulta a domicilio', 'Consultas, vacunación, desparasitación y cirugía menor a domicilio.', 'desde $55.000'),
  ('10000000-0000-4000-a000-000000000022', 'Curso de obediencia', 'Curso de adiestramiento a domicilio de 10 sesiones.', null),
  ('10000000-0000-4000-a000-000000000023', 'Guardería campestre', 'Guardería y colegio canino con asistencia veterinaria en el sitio.', null),
  ('10000000-0000-4000-a000-000000000024', 'Guardería y juego supervisado', 'Espacio de juego supervisado para perros.', null);

-- No se crean publicaciones de adopción (adoption_posts) para las fundaciones reales:
-- inventar animales disponibles bajo su nombre tergiversaría su operación actual. Esas
-- publicaciones deben venir de la fundación misma una vez contactada y vinculada.
