package com.visage.epimanager.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class CnpjValidatorTest {
    @Test
    void acceptsCurrentNumericCnpjFormat() {
        assertEquals("11222333000181", CnpjValidator.normalizeAndValidate("11.222.333/0001-81"));
    }

    @Test
    void acceptsOfficialAlphanumericExample() {
        assertEquals("12ABC34501DE35", CnpjValidator.normalizeAndValidate("12.ABC.345/01DE-35"));
    }

    @Test
    void rejectsInvalidCheckDigits() {
        assertFalse(CnpjValidator.isValid("12.ABC.345/01DE-36"));
    }

    @Test
    void rejectsWrongLengthAndRepeatedDigits() {
        assertThrows(IllegalArgumentException.class, () -> CnpjValidator.normalizeAndValidate("1234567890123"));
        assertThrows(IllegalArgumentException.class, () -> CnpjValidator.normalizeAndValidate("00.000.000/0000-00"));
    }

    @Test
    void normalizesLowercaseAlphanumericCharacters() {
        assertEquals("12ABC34501DE35", CnpjValidator.normalizeAndValidate("12.abc.345/01de-35"));
    }
}
