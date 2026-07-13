import { describe, expect, it } from 'vitest';

import { dialPrefixForCountry, validatePhoneForCountry } from '@/lib/phone';

describe('validatePhoneForCountry', () => {
  it('acepta E.164 genérico cuando el país es desconocido', () => {
    expect(validatePhoneForCountry('+9991234567', null).valid).toBe(true);
    expect(validatePhoneForCountry('+9991234567', 'Guatemala').valid).toBe(true);
  });

  it('rechaza formatos que no son E.164', () => {
    expect(validatePhoneForCountry('4433683184', 'MX')).toEqual({
      valid: false,
      error: 'PHONE_NOT_E164',
    });
    expect(validatePhoneForCountry('+0443368318', 'MX').valid).toBe(false);
    expect(validatePhoneForCountry('', 'MX').valid).toBe(false);
  });

  it('valida prefijo y longitud por país', () => {
    expect(validatePhoneForCountry('+524433683184', 'MX').valid).toBe(true);
    expect(validatePhoneForCountry('+5214433683184', 'MX').valid).toBe(true); // "1" legado
    expect(validatePhoneForCountry('+15209095510', 'US').valid).toBe(true);
    expect(validatePhoneForCountry('+50371234567', 'El Salvador').valid).toBe(true); // 8 dígitos
    expect(validatePhoneForCountry('+5037123456', 'SV')).toEqual({
      valid: false,
      error: 'PHONE_WRONG_LENGTH', // 7 dígitos
    });
    expect(validatePhoneForCountry('+524433683184', 'US')).toEqual({
      valid: false,
      error: 'PHONE_WRONG_COUNTRY_CODE',
    });
  });

  it('acepta nombres legibles y alias del país', () => {
    expect(validatePhoneForCountry('+524433683184', 'México').valid).toBe(true);
    expect(validatePhoneForCountry('+15209095510', 'Estados Unidos').valid).toBe(true);
  });
});

describe('dialPrefixForCountry', () => {
  it('devuelve el prefijo del país o null si no está mapeado', () => {
    expect(dialPrefixForCountry('MX')).toBe('+52');
    expect(dialPrefixForCountry('el salvador')).toBe('+503');
    expect(dialPrefixForCountry('US')).toBe('+1');
    expect(dialPrefixForCountry('Guatemala')).toBeNull();
    expect(dialPrefixForCountry(null)).toBeNull();
  });
});
