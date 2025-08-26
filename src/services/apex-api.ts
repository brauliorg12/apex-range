import * as dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';

const MOZA_API_KEY = process.env.MOZA_API_KEY;
const MOZA_URL = process.env.MOZA_URL;

/**
 * Obtiene el perfil de un jugador de Apex Legends usando la API de Mozambique.
 * @param playerUid UID del jugador (ejemplo: 2853374219)
 * @param platform Plataforma (por defecto: 'PC')
 * @returns Datos del perfil del jugador o null si hay error.
 */
export async function getApexProfile(
  playerUid: string,
  platform: string = 'PC'
): Promise<any | null> {
  if (!MOZA_API_KEY) {
    throw new Error('MOZA_API_KEY no está configurada en el entorno.');
  }
  const url = `${MOZA_URL}/bridge?version=5&platform=${platform}&uid=${playerUid}&auth=${MOZA_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || (data && (data as any).Error)) {
      console.log(`[API][getApexProfile] status: ERROR | url: ${url}`);
      return null;
    }
    console.log(`[API][getApexProfile] status: OK | url: ${url}`);
    return data;
  } catch (error) {
    console.log(`[API][getApexProfile] status: ERROR | url: ${url}`);
    console.error('Error al consultar la API de Apex:', error);
    return null;
  }
}

/**
 * Obtiene el perfil de un jugador de Apex Legends usando la API de Mozambique por nombre de usuario.
 * @param playerName Nombre de usuario del jugador (ejemplo: Burlon23)
 * @param platform Plataforma (por defecto: 'PC')
 * @returns Datos del perfil del jugador o null si hay error.
 */
export async function getApexProfileByName(
  playerName: string,
  platform: string = 'PC'
): Promise<any | null> {
  if (!MOZA_API_KEY) {
    throw new Error('MOZA_API_KEY no está configurada en el entorno.');
  }
  const url = `${MOZA_URL}/bridge?version=5&platform=${encodeURIComponent(
    platform
  )}&player=${encodeURIComponent(playerName)}&auth=${MOZA_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || (data && (data as any).Error)) {
      console.log(`[API][getApexProfileByName] status: ERROR | url: ${url}`);
      return null;
    }
    console.log(`[API][getApexProfileByName] status: OK | url: ${url}`);
    return data;
  } catch (error) {
    console.log(`[API][getApexProfileByName] status: ERROR | url: ${url}`);
    console.error('Error al consultar la API de Apex:', error);
    return null;
  }
}

/**
 * Obtiene la rotación de mapas actual de Apex Legends.
 * @returns Datos de la rotación de mapas o null si hay error.
 */
export async function getMapRotation(): Promise<any | null> {
  if (!MOZA_API_KEY) {
    throw new Error('MOZA_API_KEY no está configurada en el entorno.');
  }
  const url = `${MOZA_URL}/maprotation?version=2&auth=${MOZA_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || (data && (data as any).Error)) {
      console.log(`[API][getMapRotation] status: ERROR | url: ${url}`);
      return null;
    }
    console.log(`[API][getMapRotation] status: OK | url: ${url}`);
    return data;
  } catch (error) {
    console.log(`[API][getMapRotation] status: ERROR | url: ${url}`);
    console.error('Error al consultar la rotación de mapas:', error);
    return null;
  }
}

/**
 * Obtiene el RP necesario para ser Predator en Apex Legends.
 * @returns Datos del rank de Predator o null si hay error.
 */
export async function getPredatorRank(): Promise<any | null> {
  if (!MOZA_API_KEY) {
    throw new Error('MOZA_API_KEY no está configurada en el entorno.');
  }
  const url = `${MOZA_URL}/predator?auth=${MOZA_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || (data && (data as any).Error)) {
      console.log(`[API][getPredatorRank] status: ERROR | url: ${url}`);
      return null;
    }
    console.log(`[API][getPredatorRank] status: OK | url: ${url}`);
    return data;
  } catch (error) {
    console.log(`[API][getPredatorRank] status: ERROR | url: ${url}`);
    console.error('Error al consultar el rank de Predator:', error);
    return null;
  }
}