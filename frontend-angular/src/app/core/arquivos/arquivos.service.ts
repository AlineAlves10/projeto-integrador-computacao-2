import { Injectable } from '@angular/core';
import { TipoMidia } from '../../shared/models';

/** Limites conferidos no navegador; o servidor repete todas as checagens (FotoBebeService e MidiaService). */
export const LIMITES = {
  fotoPerfilBytes: 5 * 1024 * 1024,
  fotoGaleriaBytes: 10 * 1024 * 1024,
  videoBytes: 50 * 1024 * 1024,
  videoSegundos: 5 * 60,
  ladoMiniatura: 320,
} as const;

export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const TIPOS_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm'];

/** Validação e preparo de arquivos antes do envio (foto de perfil e galeria). */
@Injectable({ providedIn: 'root' })
export class ArquivosService {
  /** Foto de perfil: tipo, tamanho e assinatura do conteúdo. Retorna a mensagem de erro ou null. */
  async validarFotoPerfil(arquivo: File): Promise<string | null> {
    const invalido = 'Formato não suportado. Escolha uma imagem JPEG, PNG ou WebP.';
    if (!TIPOS_FOTO.includes(arquivo.type)) return invalido;
    if (arquivo.size > LIMITES.fotoPerfilBytes) return 'A foto deve ter no máximo 5 MB.';
    const b = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
    const texto = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
    const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const png = b[0] === 0x89 && texto(1, 3) === 'PNG';
    const webp = texto(0, 4) === 'RIFF' && texto(8, 4) === 'WEBP';
    return jpeg || png || webp ? null : invalido;
  }

  /** Galeria: identifica foto/vídeo e confere o tamanho. Lança Error com a mensagem para o usuário. */
  tipoDaMidia(arquivo: File): TipoMidia {
    if (TIPOS_FOTO.includes(arquivo.type)) {
      if (arquivo.size > LIMITES.fotoGaleriaBytes) throw new Error('A foto deve ter no máximo 10 MB.');
      return 'FOTO';
    }
    if (TIPOS_VIDEO.includes(arquivo.type)) {
      if (arquivo.size > LIMITES.videoBytes) throw new Error('O vídeo deve ter no máximo 50 MB.');
      return 'VIDEO';
    }
    throw new Error('Formato não suportado. Envie foto JPEG, PNG ou WebP, ou vídeo MP4, MOV ou WebM.');
  }

  /**
   * JPEG de um quadro do vídeo (até 320 px) para a miniatura da galeria; também confere a duração.
   * Se o navegador não conseguir ler o vídeo, resolve null e o vídeo segue sem miniatura.
   */
  miniaturaDoVideo(arquivo: File): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(arquivo);
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';
      const terminar = (valor: Blob | null, erro?: Error) => {
        URL.revokeObjectURL(url);
        if (erro) reject(erro);
        else resolve(valor);
      };
      video.onerror = () => terminar(null);
      video.onloadedmetadata = () => {
        if (video.duration > LIMITES.videoSegundos) {
          terminar(null, new Error('O vídeo deve ter no máximo 5 minutos.'));
          return;
        }
        video.currentTime = Math.min(1, video.duration / 2);
      };
      video.onseeked = () => {
        const escala = Math.min(1, LIMITES.ladoMiniatura / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(video.videoWidth * escala));
        canvas.height = Math.max(1, Math.round(video.videoHeight * escala));
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => terminar(blob), 'image/jpeg', 0.75);
      };
      video.src = url;
    });
  }
}
