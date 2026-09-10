import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * Data Transfer Object for the data that will be included in the VeriFactu hash.
 * This structure ensures that the data being hashed is consistent.
 * Based on INV-008 and the requirements for a simplified invoice.
 */
export class VeriFactuRegistroDto {
  @IsUUID()
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  numero: string; // Full invoice number, e.g., "V-2026-000001"

  @IsDate()
  @Type(() => Date)
  fechaEmision: Date;

  @IsDecimal()
  total: Prisma.Decimal;

  @IsDecimal()
  baseImponible: Prisma.Decimal;

  @IsDecimal()
  totalIva: Prisma.Decimal;

  @IsString()
  @IsNotEmpty()
  nifEmisor: string;

  // Optional data for full invoices (factura completa)
  @IsOptional()
  @IsString()
  nifReceptor?: string;

  @IsOptional()
  @IsString()
  nombreReceptor?: string;
}