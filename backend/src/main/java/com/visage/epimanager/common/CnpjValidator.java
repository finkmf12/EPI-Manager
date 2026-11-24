package com.visage.epimanager.common;

import java.util.Locale;

/** Validator for the Brazilian 14-position CNPJ, including the alphanumeric layout. */
public final class CnpjValidator {
    private static final int[] FIRST_WEIGHTS = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] SECOND_WEIGHTS = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final String FORMAT = "^[A-Z0-9]{12}[0-9]{2}$";

    private CnpjValidator() {
    }

    public static String normalizeAndValidate(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("CNPJ é obrigatório.");
        }

        String normalized = rawValue.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        if (!normalized.matches(FORMAT)) {
            throw new IllegalArgumentException("CNPJ deve conter 14 posições; as 12 primeiras aceitam letras/números e as duas últimas são dígitos.");
        }
        if (normalized.chars().distinct().count() == 1) {
            throw new IllegalArgumentException("CNPJ inválido.");
        }

        int firstDigit = calculateDigit(normalized.substring(0, 12), FIRST_WEIGHTS);
        int secondDigit = calculateDigit(normalized.substring(0, 12) + firstDigit, SECOND_WEIGHTS);
        String expected = "" + firstDigit + secondDigit;
        if (!normalized.endsWith(expected)) {
            throw new IllegalArgumentException("Dígitos verificadores do CNPJ inválidos.");
        }
        return normalized;
    }

    public static boolean isValid(String value) {
        try {
            normalizeAndValidate(value);
            return true;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static int calculateDigit(String input, int[] weights) {
        int sum = 0;
        for (int index = 0; index < weights.length; index++) {
            // Receita Federal maps each ASCII character to its ASCII value minus 48.
            int value = input.charAt(index) - 48;
            sum += value * weights[index];
        }
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}
