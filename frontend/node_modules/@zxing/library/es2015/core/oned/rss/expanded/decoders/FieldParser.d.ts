export default class FieldParser {
    private static fixed;
    private static variable;
    private static readonly TWO_DIGIT_DATA_LENGTH;
    private static readonly THREE_DIGIT_DATA_LENGTH;
    private static readonly THREE_DIGIT_PLUS_DIGIT_DATA_LENGTH;
    private static readonly FOUR_DIGIT_DATA_LENGTH;
    private constructor();
    static parseFieldsInGeneralPurpose(rawInformation: string): string;
    private static processFixedAI;
    private static processVariableAI;
}
