import { HistorySaldoType } from '../entities/history-saldo.entity';

export class HistorySaldoResponseDto {
    historySaldoId: number;
    userId: number;
    historySaldoValue: number;
    historySaldoKeterangan: string;
    historySaldoType: HistorySaldoType;
    historySaldoRef: string | null;
    historySaldoDate: Date;
    historySaldoStatus: number;

    constructor(partial: Partial<HistorySaldoResponseDto>) {
        Object.assign(this, partial);
    }
}
