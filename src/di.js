// 의존성 주입 컨테이너: 인프라→데이터→도메인 레이어를 연결하고 유스케이스를 조립
import { createHttpClient } from './infrastructure/http/HttpClient.js';
import { createLocalStorageService } from './infrastructure/storage/LocalStorageService.js';

import { createAuthApiDataSource } from './data/datasources/AuthApiDataSource.js';
import { createLibraryApiDataSource } from './data/datasources/LibraryApiDataSource.js';
import { createMenuApiDataSource } from './data/datasources/MenuApiDataSource.js';
import { createInstagramApiDataSource } from './data/datasources/InstagramApiDataSource.js';

import { createAuthRepository } from './data/repositories/AuthRepository.js';
import { createLibraryRepository } from './data/repositories/LibraryRepository.js';
import { createMenuRepository } from './data/repositories/MenuRepository.js';
import { createInstagramRepository } from './data/repositories/InstagramRepository.js';

import { createLoginUseCase } from './domain/usecases/LoginUseCase.js';
import { createReloginUseCase } from './domain/usecases/ReloginUseCase.js';
import { createGetQRCodeUseCase } from './domain/usecases/GetQRCodeUseCase.js';
import { createGetSeatUseCase } from './domain/usecases/GetSeatUseCase.js';
import { createReserveSeatUseCase } from './domain/usecases/ReserveSeatUseCase.js';
import { createCancelReservationUseCase } from './domain/usecases/CancelReservationUseCase.js';
import { createDischargeSeatUseCase } from './domain/usecases/DischargeSeatUseCase.js';
import { createGetMenuUseCase } from './domain/usecases/GetMenuUseCase.js';
import { createGetInstagramProfileUseCase } from './domain/usecases/GetInstagramProfileUseCase.js';
import { createGetShuttleDataUseCase } from './domain/usecases/GetShuttleDataUseCase.js';
import { createGetSubwayArrivalsUseCase } from './domain/usecases/GetSubwayArrivalsUseCase.js';

import { createShuttleDataSource } from './data/datasources/ShuttleDataSource.js';
import { createShuttleRepository } from './data/repositories/ShuttleRepository.js';

// Infrastructure
const httpClient = createHttpClient();
const storageService = createLocalStorageService();

// Data Sources
const authApiDataSource = createAuthApiDataSource({ httpClient });
const libraryApiDataSource = createLibraryApiDataSource({ httpClient });
const menuApiDataSource = createMenuApiDataSource({ httpClient });
const instagramApiDataSource = createInstagramApiDataSource({ httpClient });
const shuttleDataSource = createShuttleDataSource({ httpClient });

// Repositories
export const authRepository = createAuthRepository({ authApiDataSource, storageService });
export const libraryRepository = createLibraryRepository({ libraryApiDataSource });
export const menuRepository = createMenuRepository({ menuApiDataSource });
export const instagramRepository = createInstagramRepository({ instagramApiDataSource });
export const shuttleRepository = createShuttleRepository({ shuttleDataSource });

// Use Cases
export const loginUseCase = createLoginUseCase({ authRepository });
export const reloginUseCase = createReloginUseCase({ authRepository });
export const getQRCodeUseCase = createGetQRCodeUseCase({ libraryRepository });
export const getSeatUseCase = createGetSeatUseCase({ libraryRepository });
export const reserveSeatUseCase = createReserveSeatUseCase({ libraryRepository });
export const cancelReservationUseCase = createCancelReservationUseCase({ libraryRepository });
export const dischargeSeatUseCase = createDischargeSeatUseCase({ libraryRepository });
export const getMenuUseCase = createGetMenuUseCase({ menuRepository });
export const getInstagramProfileUseCase = createGetInstagramProfileUseCase({ instagramRepository });
export const getShuttleDataUseCase = createGetShuttleDataUseCase({ shuttleRepository });
export const getSubwayArrivalsUseCase = createGetSubwayArrivalsUseCase({ shuttleRepository });
