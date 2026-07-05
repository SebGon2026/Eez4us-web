// Traducción legal completa al inglés del documento de content-es.tsx.
// Mantener ambos archivos sincronizados sección por sección.
export function PrivacyContentEn() {
  return (
    <>
      <p>
        At Eez4us we take the privacy of families, minors and school staff seriously. This
        policy describes what data we collect, what we use it for, who we share it with and
        what rights you have over it.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Eez4us is a school-zone vehicle pickup coordination service. We operate under a B2B2C
        model: we contract directly with educational institutions and, through them, serve
        parents and school staff. Parents never pay Eez4us.
      </p>

      <h2>2. What data we collect</h2>
      <h3>2.1 From the school</h3>
      <ul>
        <li>Name, address, contact details and internal code.</li>
        <li>Logo and panel visual configuration.</li>
        <li>Staff data (director, support staff): name, email, role.</li>
      </ul>
      <h3>2.2 From parents / guardians</h3>
      <ul>
        <li>Name, email, mobile phone number in E.164 format.</li>
        <li>Associated vehicles (license plate, model, color).</li>
        <li>Secondary family members authorized to pick up (name, relationship, ID document).</li>
        <li>
          Real-time location data <strong>only while a trip is active</strong>: latitude,
          longitude, speed and heading, captured every 5 seconds.
        </li>
        <li>Messages exchanged with the school within the platform.</li>
        <li>Push notification tokens from the mobile device.</li>
      </ul>
      <h3>2.3 About students (minors)</h3>
      <ul>
        <li>First name, last name, grade, school internal identifier.</li>
        <li>Link to their authorized parents/guardians.</li>
        <li>Pickup history (which adult picked them up and at what time).</li>
      </ul>
      <p>
        We never request unnecessary sensitive data (health, religion, ideology, biometric
        data), nor do we collect information about the minor beyond what is necessary to
        coordinate their pickup.
      </p>

      <h2>3. What we use the data for</h2>
      <ul>
        <li>Coordinating the safe pickup of the minor by an authorized adult.</li>
        <li>
          Calculating the estimated time of arrival and displaying it to the school in real
          time.
        </li>
        <li>
          Triggering automatic alerts when a parent enters the geofence of the pickup point.
        </li>
        <li>Auditing who picked up each minor and at what time.</li>
        <li>Billing the educational institution based on the number of active students.</li>
        <li>Handling support requests.</li>
      </ul>

      <h2>4. Location data: principles</h2>
      <ul>
        <li>
          Tracking is activated <strong>only when the parent taps “On my way”</strong> in the
          mobile app. We never track in the background without an active trip.
        </li>
        <li>
          On iOS we request the <em>“When In Use”</em> permission exclusively. Never{' '}
          <em>“Always”</em>.
        </li>
        <li>
          On Android we use a <em>Foreground Service</em> with a visible notification for the
          duration of the trip, so the user always knows tracking is active.
        </li>
        <li>
          Positions are discarded as soon as the trip ends. Only the fact of arrival and the
          trip events are persisted, not the full trace, except for a specific investigation.
        </li>
      </ul>

      <h2>5. Who we share data with</h2>
      <ul>
        <li>
          <strong>The school</strong> sees, in real time, the parents on their way to its pickup
          points. Each parent only sees <strong>their own trip</strong>, never anyone else&apos;s.
        </li>
        <li>
          <strong>Technology providers</strong>: Cloudflare (hosting), Prisma Data Platform
          (database), Pusher (encrypted real-time channels), Google Maps (route calculation on
          the backend), Stripe (school billing), Expo (push notifications), and email/WhatsApp
          providers used to send invitations.
        </li>
        <li>
          <strong>Authorities</strong>: only under a valid court order or a formal request from
          a competent authority.
        </li>
      </ul>

      <h2>6. Retention period</h2>
      <ul>
        <li>
          Parent and vehicle data: for as long as the school keeps the parent&apos;s account
          active.
        </li>
        <li>
          Student data: while the student is active at the school. When a student is removed,
          their data is deleted or anonymized within a maximum of 90 days.
        </li>
        <li>Trip history: up to 24 months.</li>
        <li>
          Audit logs: up to 24 months, to comply with regulations and school requirements.
        </li>
      </ul>

      <h2>7. Your rights</h2>
      <p>
        You may exercise your rights of access, rectification, erasure, objection and
        portability over your personal data. To do so:
      </p>
      <ul>
        <li>
          From the mobile app, under <em>My profile → Delete account</em> you can request
          deletion.
        </li>
        <li>
          Or write to us at <a href="mailto:privacidad@eez4us.com">privacidad@eez4us.com</a>.
        </li>
      </ul>
      <p>
        If the data belongs to a minor, the request must be submitted by their parent or legal
        guardian.
      </p>

      <h2>8. Security</h2>
      <ul>
        <li>Passwords are stored using scrypt hashing.</li>
        <li>
          Real-time communications between the parent, the backend and the school are encrypted
          with NaCl secretbox over private Pusher channels.
        </li>
        <li>Access to the admin panel requires authentication and is audited.</li>
        <li>Data always travels over HTTPS.</li>
      </ul>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy to reflect legal or product changes. We will notify you by
        email or within the panel with reasonable advance notice when changes are significant.
      </p>

      <h2>10. California residents (CCPA/CPRA)</h2>
      <p>
        If you are a California resident, the California Consumer Privacy Act, as amended by
        the CPRA, grants you additional rights over your personal information.
      </p>
      <ul>
        <li>
          <strong>We do not sell or “share”</strong> your personal information or that of
          minors (within the meaning of the CCPA/CPRA, that is, for cross-context behavioral
          advertising). Nor have we done so in the preceding twelve months.
        </li>
        <li>
          <strong>Categories we collect:</strong> identifiers (name, email, phone), limited
          commercial information (school billing), geolocation only during an active trip, and
          device/internet data (notification tokens). Details are provided in Section 2.
        </li>
        <li>
          <strong>Your rights:</strong> to know what data we hold and how we use it, to access
          it, correct it, delete it, and not to be discriminated against for exercising these
          rights.
        </li>
        <li>
          <strong>How to exercise them:</strong> write to us at{' '}
          <a href="mailto:privacidad@eez4us.com">privacidad@eez4us.com</a>. You may use an
          authorized agent; we will verify your identity before responding. If the data
          concerns a minor, the request must be made by their parent or guardian.
        </li>
      </ul>

      <h2>11. Children&apos;s privacy and student data (U.S.)</h2>
      <ul>
        <li>
          The app <strong>is not directed at children</strong> and does not collect data
          directly from them: minors do not have accounts. Student data is provided by the
          school and/or the parent or guardian.
        </li>
        <li>
          We process student data <strong>on behalf of and under the instruction of the school</strong>,
          acting as a <em>school official</em> with a legitimate educational interest within the
          meaning of FERPA. We do not reuse it for our own purposes.
        </li>
        <li>
          We <strong>never</strong> use minors&apos; data for advertising, commercial profiling
          or sale to third parties, in line with COPPA and state student privacy laws (e.g.,
          SOPIPA in California).
        </li>
        <li>
          The school is responsible for the notices and parental consents required by law to
          collect student data. We delete or anonymize such data at the school&apos;s request or
          upon the student&apos;s removal (see Section 6).
        </li>
      </ul>

      <h2>12. Contact</h2>
      <p>
        Privacy and personal data:{' '}
        <a href="mailto:privacidad@eez4us.com">privacidad@eez4us.com</a>
        <br />
        General support: <a href="mailto:soporte@eez4us.com">soporte@eez4us.com</a>
      </p>
    </>
  );
}
