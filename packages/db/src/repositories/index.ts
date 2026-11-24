import { AnalyticsRollupRepository } from "#src/repositories/analytics-repository";
import {
  AuthAccountsRepository,
  MfaRecoveryRepository,
} from "#src/repositories/auth-account-repository";
import type { DbRepositoryTarget } from "#src/repositories/base-repository";
import { OrdersRepository } from "#src/repositories/billing-repository";
import {
  GameLevelsRepository,
  PackagesRepository,
  TaggingRepository,
} from "#src/repositories/catalog-repository";
import {
  ChildProfilesRepository,
  ChildStickersRepository,
  KidWorldRepository,
} from "#src/repositories/child-repository";
import { ConsentsRepository } from "#src/repositories/consents-repository";
import {
  CurriculaRepository,
  PersonalCurriculaRepository,
} from "#src/repositories/curriculum-repository";
import { EntitlementsRepository } from "#src/repositories/entitlements-repository";
import { UsersRepository } from "#src/repositories/identity-repository";
import {
  AiCreditsRepository,
  CustomGamesRepository,
  ExportsRepository,
  LibraryRepository,
} from "#src/repositories/library-addons-repository";
import { ManagersRepository } from "#src/repositories/managers-repository";
import { NotificationsRepository } from "#src/repositories/notifications-repository";
import {
  AuditLogsRepository,
  SystemRepository,
} from "#src/repositories/ops-repository";
import {
  BadgesRepository,
  MasteryRepository,
  PlaySessionsRepository,
  TelemetryRepository,
} from "#src/repositories/play-repository";
import { RecurringSubscriptionsRepository } from "#src/repositories/recurring-subscriptions-repository";
import { TaxonomyRepository } from "#src/repositories/taxonomy-repository";

export interface MindKidRepositories {
  readonly users: UsersRepository;
  readonly managers: ManagersRepository;
  readonly authAccounts: AuthAccountsRepository;
  readonly consents: ConsentsRepository;
  readonly mfaRecovery: MfaRecoveryRepository;
  readonly childProfiles: ChildProfilesRepository;
  readonly childStickers: ChildStickersRepository;
  readonly kidWorld: KidWorldRepository;
  readonly packages: PackagesRepository;
  readonly taxonomy: TaxonomyRepository;
  readonly gameLevels: GameLevelsRepository;
  readonly tagging: TaggingRepository;
  readonly curricula: CurriculaRepository;
  readonly personalCurricula: PersonalCurriculaRepository;
  readonly playSessions: PlaySessionsRepository;
  readonly mastery: MasteryRepository;
  readonly badges: BadgesRepository;
  readonly telemetry: TelemetryRepository;
  readonly analyticsRollup: AnalyticsRollupRepository;
  readonly library: LibraryRepository;
  readonly customGames: CustomGamesRepository;
  readonly aiCredits: AiCreditsRepository;
  readonly exports: ExportsRepository;
  readonly orders: OrdersRepository;
  readonly entitlements: EntitlementsRepository;
  readonly recurringSubscriptions: RecurringSubscriptionsRepository;
  readonly auditLogs: AuditLogsRepository;
  readonly notifications: NotificationsRepository;
  readonly system: SystemRepository;
}

export function createRepositories(
  target?: DbRepositoryTarget
): MindKidRepositories {
  return {
    users: new UsersRepository(target),
    managers: new ManagersRepository(target),
    authAccounts: new AuthAccountsRepository(target),
    consents: new ConsentsRepository(target),
    mfaRecovery: new MfaRecoveryRepository(target),
    childProfiles: new ChildProfilesRepository(target),
    childStickers: new ChildStickersRepository(target),
    kidWorld: new KidWorldRepository(target),
    packages: new PackagesRepository(target),
    taxonomy: new TaxonomyRepository(target),
    gameLevels: new GameLevelsRepository(target),
    tagging: new TaggingRepository(target),
    curricula: new CurriculaRepository(target),
    personalCurricula: new PersonalCurriculaRepository(target),
    playSessions: new PlaySessionsRepository(target),
    mastery: new MasteryRepository(target),
    badges: new BadgesRepository(target),
    telemetry: new TelemetryRepository(target),
    analyticsRollup: new AnalyticsRollupRepository(target),
    library: new LibraryRepository(target),
    customGames: new CustomGamesRepository(target),
    aiCredits: new AiCreditsRepository(target),
    exports: new ExportsRepository(target),
    orders: new OrdersRepository(target),
    entitlements: new EntitlementsRepository(target),
    recurringSubscriptions: new RecurringSubscriptionsRepository(target),
    auditLogs: new AuditLogsRepository(target),
    notifications: new NotificationsRepository(target),
    system: new SystemRepository(target),
  };
}

export const repos: MindKidRepositories = createRepositories();
