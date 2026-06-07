import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/legal-page-shell';

export const metadata: Metadata = {
  title: 'Términos del servicio — Eez4us',
  description: 'Condiciones de uso de la plataforma Eez4us.',
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Términos del servicio" updatedAt="25 de mayo de 2026">
      <p>
        Al usar Eez4us aceptás los términos descritos abajo. Si no estás de acuerdo, te pedimos
        que dejes de utilizar el servicio.
      </p>

      <h2>1. Qué es Eez4us</h2>
      <p>
        Eez4us es una plataforma que coordina la recogida vehicular de menores en zonas
        escolares. Conecta tres partes:
      </p>
      <ul>
        <li>
          <strong>La institución educativa (cliente):</strong> contrata el servicio y paga la
          suscripción.
        </li>
        <li>
          <strong>El padre, madre o tutor:</strong> usa la app móvil para avisar que va en camino
          y permitir el seguimiento de su viaje.
        </li>
        <li>
          <strong>El personal escolar:</strong> ve, dentro del panel, los padres en camino y
          confirma manualmente la entrega del menor.
        </li>
      </ul>

      <h2>2. Cuentas</h2>
      <h3>2.1 Colegio</h3>
      <p>
        La cuenta del colegio se da de alta tras la firma del contrato comercial. El director
        designado es responsable de gestionar al staff que accede al panel y de mantener al día
        la nómina de alumnos.
      </p>
      <h3>2.2 Padres</h3>
      <p>
        Los padres entran a la plataforma <strong>únicamente por invitación del colegio</strong>{' '}
        (no hay registro abierto). El padre es responsable de la veracidad de los datos que
        carga: vehículos, familiares autorizados y autorizaciones temporales.
      </p>
      <h3>2.3 Credenciales</h3>
      <p>
        El usuario es responsable de mantener la confidencialidad de su contraseña. Cualquier
        actividad bajo una cuenta se considera realizada por su titular.
      </p>

      <h2>3. Modelo comercial</h2>
      <ul>
        <li>
          Eez4us factura al colegio mensualmente en función de la cantidad de alumnos activos.
        </li>
        <li>
          El precio por alumno se acuerda en el contrato comercial.{' '}
          <strong>Los padres nunca pagan a Eez4us</strong>.
        </li>
        <li>
          Eez4us no se responsabiliza por arreglos económicos entre el colegio y las familias.
        </li>
        <li>
          La falta de pago del colegio puede derivar en la suspensión total del servicio para esa
          institución, previo aviso.
        </li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>El usuario se compromete a no:</p>
      <ul>
        <li>Suplantar identidad de otra persona dentro de la plataforma.</li>
        <li>
          Cargar datos falsos, especialmente respecto de quién está autorizado a recoger a un
          menor.
        </li>
        <li>
          Utilizar la plataforma con fines distintos a la coordinación de recogida escolar.
        </li>
        <li>
          Intentar acceder, manipular o extraer datos de otras escuelas o de otras familias.
        </li>
        <li>Hacer ingeniería inversa o eludir las medidas de seguridad de la plataforma.</li>
      </ul>

      <h2>5. Entrega del menor</h2>
      <p>
        El sistema dispara un aviso al staff escolar cuando un padre ingresa al geofence del
        punto de recogida. Ese aviso{' '}
        <strong>no es prueba de entrega</strong>. La entrega del menor solo queda confirmada
        cuando el personal del colegio la valida manualmente desde el panel administrativo,
        cotejando visualmente al adulto autorizado.
      </p>
      <p>
        Eez4us aporta la herramienta tecnológica de coordinación; la decisión y la
        responsabilidad de entregar al menor permanece en el colegio.
      </p>

      <h2>6. Autorizaciones temporales</h2>
      <ul>
        <li>
          El padre puede generar autorizaciones temporales con código corto para personas
          ocasionales (niñera, familiar lejano).
        </li>
        <li>
          El código es válido únicamente para la fecha indicada y se invalida tras el primer uso.
        </li>
        <li>
          El staff escolar debe validar visualmente al portador del código antes de entregar al
          menor.
        </li>
      </ul>

      <h2>7. Geolocalización</h2>
      <ul>
        <li>
          El rastreo se activa <strong>únicamente</strong> cuando el padre pulsa “Voy en camino”
          y termina al confirmar llegada o cancelar el viaje.
        </li>
        <li>
          Es responsabilidad del padre mantener encendido el dispositivo móvil y otorgar los
          permisos solicitados mientras dure el viaje.
        </li>
        <li>
          Eez4us no se hace responsable por demoras, desvíos o errores en el ETA derivados de
          señal GPS, tráfico, o condiciones del proveedor de mapas.
        </li>
      </ul>

      <h2>8. Datos personales</h2>
      <p>
        El tratamiento de datos personales se rige por nuestra{' '}
        <a href="/privacy">Política de privacidad</a>, que forma parte integrante de estos
        términos.
      </p>

      <h2>9. Disponibilidad del servicio</h2>
      <p>
        Trabajamos para mantener la plataforma operativa 24/7, pero no garantizamos
        disponibilidad ininterrumpida. Podemos realizar mantenimientos programados notificando
        con antelación cuando sea posible.
      </p>

      <h2>10. Limitación de responsabilidad</h2>
      <p>
        Dentro del máximo permitido por la ley aplicable, Eez4us no será responsable por daños
        indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la
        plataforma. La responsabilidad total acumulada de Eez4us frente al colegio queda limitada
        a los montos efectivamente abonados por éste en los doce (12) meses previos al hecho.
      </p>

      <h2>11. Suspensión y baja</h2>
      <ul>
        <li>El colegio puede cancelar la suscripción según lo pactado contractualmente.</li>
        <li>
          El padre puede solicitar la baja de su cuenta desde la app o por escrito a soporte. Sus
          hijos siguen vinculados al colegio salvo que el colegio mismo los dé de baja.
        </li>
        <li>
          Eez4us puede suspender cuentas que violen estos términos o pongan en riesgo a otros
          usuarios.
        </li>
      </ul>

      <h2>12. Modificaciones</h2>
      <p>
        Estos términos pueden ser actualizados. Notificaremos los cambios significativos con
        antelación razonable. El uso continuado de la plataforma luego del aviso implica la
        aceptación de los nuevos términos.
      </p>

      <h2>13. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia
        derivada de su interpretación o aplicación se someterá a los tribunales ordinarios con
        competencia en la Ciudad Autónoma de Buenos Aires, renunciando las partes a cualquier
        otro fuero o jurisdicción.
      </p>

      <h2>14. Contacto</h2>
      <p>
        Dudas sobre estos términos: <a href="mailto:legal@eez4us.com">legal@eez4us.com</a>
        <br />
        Soporte: <a href="mailto:soporte@eez4us.com">soporte@eez4us.com</a>
      </p>
    </LegalPageShell>
  );
}
