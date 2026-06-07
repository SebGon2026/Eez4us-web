import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/legal-page-shell';

export const metadata: Metadata = {
  title: 'Política de privacidad — Eez4us',
  description: 'Cómo Eez4us recolecta, usa y protege los datos personales.',
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Política de privacidad" updatedAt="25 de mayo de 2026">
      <p>
        En Eez4us nos tomamos en serio la privacidad de las familias, los menores y el personal
        del colegio. Esta política describe qué datos recolectamos, para qué los usamos, con
        quién los compartimos y qué derechos tenés sobre ellos.
      </p>

      <h2>1. Quiénes somos</h2>
      <p>
        Eez4us es un servicio de coordinación de recogida vehicular en zonas escolares. Operamos
        bajo un modelo B2B2C: contratamos directamente con instituciones educativas y a través de
        ellas servimos a los padres y al personal escolar. Los padres nunca pagan a Eez4us.
      </p>

      <h2>2. Qué datos recolectamos</h2>
      <h3>2.1 Del colegio</h3>
      <ul>
        <li>Nombre, dirección, datos de contacto y código interno.</li>
        <li>Logo y configuración visual del panel.</li>
        <li>Datos del staff (director, personal auxiliar): nombre, email, rol.</li>
      </ul>
      <h3>2.2 De los padres / tutores</h3>
      <ul>
        <li>Nombre, email, teléfono móvil en formato E.164.</li>
        <li>Vehículos asociados (patente, modelo, color).</li>
        <li>Familiares secundarios autorizados a recoger (nombre, relación, documento).</li>
        <li>
          Datos de ubicación en tiempo real <strong>solo mientras hay un viaje activo</strong>:
          latitud, longitud, velocidad y rumbo, capturados cada 5 segundos.
        </li>
        <li>Mensajes intercambiados con el colegio dentro de la plataforma.</li>
        <li>Tokens de notificaciones push del dispositivo móvil.</li>
      </ul>
      <h3>2.3 De los alumnos (menores)</h3>
      <ul>
        <li>Nombre, apellido, grado, identificador interno del colegio.</li>
        <li>Vínculo con sus padres/tutores autorizados.</li>
        <li>Historial de entregas (qué adulto los recogió y a qué hora).</li>
      </ul>
      <p>
        Nunca solicitamos datos sensibles innecesarios (salud, religión, ideología, datos
        biométricos) ni recolectamos información del menor que vaya más allá de lo necesario para
        la coordinación de su recogida.
      </p>

      <h2>3. Para qué usamos los datos</h2>
      <ul>
        <li>Coordinar la recogida segura del menor por parte de un adulto autorizado.</li>
        <li>
          Calcular el tiempo estimado de llegada y mostrarlo en tiempo real al colegio.
        </li>
        <li>
          Disparar avisos automáticos cuando un padre ingresa al geofence del punto de recogida.
        </li>
        <li>Auditar quién retiró a cada menor y a qué hora.</li>
        <li>Facturar a la institución educativa por la cantidad de alumnos activos.</li>
        <li>Atender solicitudes de soporte.</li>
      </ul>

      <h2>4. Datos de ubicación: principios</h2>
      <ul>
        <li>
          El tracking se activa <strong>únicamente cuando el padre pulsa “Voy en camino”</strong>{' '}
          en la app móvil. Nunca rastreamos en segundo plano sin trip activo.
        </li>
        <li>
          En iOS pedimos permiso <em>“When In Use”</em> exclusivamente. Nunca <em>“Always”</em>.
        </li>
        <li>
          En Android usamos un <em>Foreground Service</em> con notificación visible mientras dura
          el viaje, para que el usuario siempre sepa que el tracking está activo.
        </li>
        <li>
          Las posiciones se descartan apenas el viaje termina. Solo se persiste el hecho de la
          llegada y los eventos del viaje, no la traza completa, salvo investigación específica.
        </li>
      </ul>

      <h2>5. Con quién compartimos</h2>
      <ul>
        <li>
          <strong>El colegio</strong> ve, en tiempo real, los padres en camino a sus puntos de
          recogida. Cada padre solo ve <strong>su propio viaje</strong>, nunca el de otros.
        </li>
        <li>
          <strong>Proveedores tecnológicos</strong>: Cloudflare (hosting), Prisma Data Platform
          (base de datos), Pusher (canales tiempo real cifrados), Google Maps (cálculo de rutas
          en el backend), Stripe (facturación al colegio), Expo (notificaciones push),
          proveedores de email/WhatsApp para enviar invitaciones.
        </li>
        <li>
          <strong>Autoridades</strong>: solo cuando exista orden judicial válida o pedido formal
          de una autoridad competente.
        </li>
      </ul>

      <h2>6. Tiempo de retención</h2>
      <ul>
        <li>
          Datos del padre y vehículos: mientras el colegio mantenga vigente la cuenta del padre.
        </li>
        <li>
          Datos del alumno: mientras esté activo en el colegio. Al dar de baja al alumno, sus
          datos se borran o anonimizan en un plazo máximo de 90 días.
        </li>
        <li>Historial de viajes: hasta 24 meses.</li>
        <li>
          Logs de auditoría: hasta 24 meses, para cumplir con regulaciones y requerimientos del
          colegio.
        </li>
      </ul>

      <h2>7. Tus derechos</h2>
      <p>
        Podés ejercer los derechos de acceso, rectificación, supresión, oposición y portabilidad
        sobre tus datos personales. Para hacerlo:
      </p>
      <ul>
        <li>
          Desde la app móvil, en <em>Mi perfil → Eliminar cuenta</em> podés solicitar la baja.
        </li>
        <li>
          O bien escribinos a{' '}
          <a href="mailto:privacidad@eez4us.com">privacidad@eez4us.com</a>.
        </li>
      </ul>
      <p>
        Si los datos pertenecen a un menor, la solicitud la debe formalizar su padre, madre o
        tutor legal.
      </p>

      <h2>8. Seguridad</h2>
      <ul>
        <li>Las contraseñas se almacenan con hashing scrypt.</li>
        <li>
          Las comunicaciones en tiempo real entre el padre, el backend y el colegio van cifradas
          con NaCl secretbox sobre canales privados de Pusher.
        </li>
        <li>El acceso al panel admin requiere autenticación y se audita.</li>
        <li>Los datos viajan siempre por HTTPS.</li>
      </ul>

      <h2>9. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política para reflejar cambios legales o del producto. Te
        notificaremos por email o dentro del panel con razonable antelación cuando los cambios
        sean significativos.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Privacidad y datos personales:{' '}
        <a href="mailto:privacidad@eez4us.com">privacidad@eez4us.com</a>
        <br />
        Soporte general: <a href="mailto:soporte@eez4us.com">soporte@eez4us.com</a>
      </p>
    </LegalPageShell>
  );
}
