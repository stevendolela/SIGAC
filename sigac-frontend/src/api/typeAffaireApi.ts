// API client pour TypeAffaire (CRUD)
import api from './api-client';

export interface TypeAffaireDto {
  id: string;
  nom: string;
  description?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
}

export interface CreateTypeAffaireDto {
  nom: string;
  description?: string;
}

export interface UpdateTypeAffaireDto {
  nom?: string;
  description?: string;
}

export class TypeAffaireApi {
  private baseUrl = '/TypeAffaire';

  async list(): Promise<TypeAffaireDto[]> {
  const res = await api.get(this.baseUrl);
  return res.data as TypeAffaireDto[];
  }

  async create(dto: CreateTypeAffaireDto): Promise<TypeAffaireDto> {
    const res = await api.post(this.baseUrl, dto);
    return res.data as TypeAffaireDto;
  }

  async update(id: string, dto: UpdateTypeAffaireDto): Promise<TypeAffaireDto> {
    const res = await api.put(`${this.baseUrl}/${id}`, dto);
    return res.data as TypeAffaireDto;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}
