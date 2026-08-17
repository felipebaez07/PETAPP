-- Datos de ejemplo (demo/seed) para poblar el directorio piloto mientras se
-- vinculan los aliados reales. Nombres ficticios — reemplazar por los ~10
-- aliados reales del piloto (PDD sección 6.1) antes de salir a producción.
-- Estos registros no tienen owner_id: se "reclaman" cuando el aliado real
-- se registra y el admin vincula su cuenta a la fila existente.

insert into public.establishments
  (id, name, slug, category, description, address, city, lat, lng, phone, whatsapp_number, is_24_7, is_active, verification_status, verified_at)
values
  ('00000000-0000-4000-a000-000000000001', 'Veterinaria Central Ibagué', 'veterinaria-central-ibague', 'veterinaria',
   'Atención general, urgencias y hospitalización. Más de 10 años atendiendo el centro de la ciudad.',
   'Calle 15 # 3-20, Centro', 'Ibagué', 4.4389, -75.2322, '6082601234', '573001234501', true, true, 'verificado', now()),

  ('00000000-0000-4000-a000-000000000002', 'Clínica Veterinaria Pata Amiga', 'clinica-pata-amiga', 'veterinaria',
   'Consulta general, vacunación, cirugía y odontología veterinaria.',
   'Carrera 5 # 42-10, Belén', 'Ibagué', 4.4512, -75.2101, '6082605678', '573001234502', false, true, 'verificado', now()),

  ('00000000-0000-4000-a000-000000000003', 'Veterinaria y Urgencias 24H Tolima', 'veterinaria-urgencias-24h-tolima', 'veterinaria',
   'Atención de urgencias las 24 horas, todos los días.',
   'Avenida Ambalá # 20-45', 'Ibagué', 4.4601, -75.2287, '6082609876', '573001234503', true, true, 'verificado', now()),

  ('00000000-0000-4000-a000-000000000004', 'PetShop La 19', 'petshop-la-19', 'comercio',
   'Alimentos, accesorios, juguetes e higiene para perros y gatos.',
   'Carrera 4 # 19-30', 'Ibagué', 4.4370, -75.2005, '6082611122', '573001234504', false, true, 'verificado', now()),

  ('00000000-0000-4000-a000-000000000005', 'Distribuidora Mascotas del Tolima', 'distribuidora-mascotas-tolima', 'comercio',
   'Venta al detal y por mayor de concentrados y suplementos.',
   'Carrera 8 # 30-12', 'Ibagué', 4.4425, -75.2158, '6082613344', '573001234505', false, true, 'en_revision', null),

  ('00000000-0000-4000-a000-000000000006', 'Estética Canina Huellitas', 'estetica-canina-huellitas', 'comercio',
   'Baño, corte y spa canino/felino con cita previa.',
   'Calle 42 # 6-15, Belén', 'Ibagué', 4.4530, -75.2090, '6082615566', '573001234506', false, true, 'verificado', now()),

  ('00000000-0000-4000-a000-000000000007', 'Dra. Camila Rojas · Medicina Veterinaria', 'dra-camila-rojas-veterinaria', 'profesional',
   'Consulta a domicilio y medicina alternativa veterinaria.',
   'Zona norte de Ibagué (atención a domicilio)', 'Ibagué', 4.4680, -75.2210, '6082617788', '573001234507', false, true, 'verificado', now()),

  ('00000000-0000-4000-a000-000000000008', 'Guardería y Entrenamiento CanApp', 'guarderia-entrenamiento-canapp', 'comercio',
   'Guardería diurna, paseos y entrenamiento básico de obediencia.',
   'Carrera 12 # 55-08', 'Ibagué', 4.4550, -75.1980, '6082619900', '573001234508', false, true, 'pendiente', null),

  ('00000000-0000-4000-a000-000000000009', 'Fundación Huellas de Esperanza Tolima', 'fundacion-huellas-esperanza-tolima', 'fundacion',
   'Rescate, esterilización y adopción responsable de perros y gatos en Ibagué.',
   'Zona sur de Ibagué', 'Ibagué', 4.4180, -75.2260, '6082622233', '573001234509', false, true, 'verificado', now()),

  ('00000000-0000-4000-a000-000000000010', 'Refugio Patitas Sin Hogar', 'refugio-patitas-sin-hogar', 'fundacion',
   'Refugio independiente enfocado en animales en condición de calle y adopciones.',
   'Vereda La Vega, Ibagué', 'Ibagué', 4.4050, -75.2400, '6082624455', '573001234510', false, true, 'verificado', now());

insert into public.establishment_hours (establishment_id, day_of_week, open_time, close_time, closed)
select e.id, d.day_of_week,
  case when e.is_24_7 then '00:00'::time else '08:00'::time end,
  case when e.is_24_7 then '23:59'::time else '18:00'::time end,
  case when d.day_of_week = 0 and not e.is_24_7 then true else false end
from public.establishments e
cross join (select generate_series(0,6) as day_of_week) d;

insert into public.services (establishment_id, name, description, price_reference)
values
  ('00000000-0000-4000-a000-000000000001', 'Consulta general', 'Valoración clínica completa', 'desde $50.000'),
  ('00000000-0000-4000-a000-000000000001', 'Vacunación', 'Esquema completo perros y gatos', 'desde $35.000'),
  ('00000000-0000-4000-a000-000000000002', 'Cirugía menor', 'Esterilización y procedimientos ambulatorios', 'desde $180.000'),
  ('00000000-0000-4000-a000-000000000003', 'Urgencia 24H', 'Atención inmediata cualquier hora del día', 'desde $80.000'),
  ('00000000-0000-4000-a000-000000000004', 'Venta de alimento concentrado', 'Marcas premium y económicas', null),
  ('00000000-0000-4000-a000-000000000006', 'Baño y corte', 'Spa completo con productos hipoalergénicos', 'desde $40.000'),
  ('00000000-0000-4000-a000-000000000007', 'Consulta a domicilio', 'Visita veterinaria en tu hogar', 'desde $70.000'),
  ('00000000-0000-4000-a000-000000000008', 'Guardería diurna', 'Cuidado y socialización por día', 'desde $30.000');

insert into public.adoption_posts
  (id, establishment_id, animal_name, species, estimated_age, sex, sterilized, vaccinated, health_notes, personality_notes, location_text, status, cover_photo_url)
values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000009', 'Luna', 'perro', '2 años aprox.', 'hembra', true, true,
   'Esterilizada y con esquema de vacunación completo.', 'Tranquila, sociable con niños y otros perros.', 'Ibagué, zona sur', 'disponible', null),

  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000009', 'Simón', 'gato', '8 meses aprox.', 'macho', false, true,
   'Vacunado, pendiente de esterilización.', 'Juguetón, se adapta bien a apartamentos.', 'Ibagué, zona sur', 'disponible', null),

  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000010', 'Toby', 'perro', 'Cachorro (3 meses)', 'macho', false, false,
   'En proceso de primera vacunación.', 'Muy activo, requiere hogar con espacio.', 'Vereda La Vega, Ibagué', 'disponible', null),

  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000010', 'Mora', 'gato', '1 año aprox.', 'hembra', true, true,
   'Esterilizada, esquema de vacunación al día.', 'Independiente, ideal para hogar tranquilo.', 'Vereda La Vega, Ibagué', 'en_proceso', null);
