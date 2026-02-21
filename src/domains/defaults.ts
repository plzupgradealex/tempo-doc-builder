/**
 * Default knowledge domains for agenda topics.
 *
 * Each domain has:
 *   - A unique id
 *   - A FontAwesome icon class
 *   - A description explaining the topic to clients
 *   - Default bullet points for sub-topics
 *   - Recommended attendee roles
 *
 * Users can edit, add, and reset these via the UI.
 */

import type { KnowledgeDomain } from '../types';
import { t } from '../i18n';

export function getDefaultDomains(): KnowledgeDomain[] {
  return [
    {
      id: 'procurement',
      name: t('domainProcurement'),
      icon: 'fa-cart-shopping',
      description: t('domainProcurementDesc'),
      defaultBulletPoints: [
        t('bulletProcurement1'),
        t('bulletProcurement2'),
        t('bulletProcurement3'),
        t('bulletProcurement4'),
      ],
      recommendedAttendees: [
        t('attendeeProcurementManager'),
        t('attendeePurchasingAgent'),
        t('attendeeAPSpecialist'),
      ],
      isDefault: true,
    },
    {
      id: 'inventory',
      name: t('domainInventory'),
      icon: 'fa-boxes-stacked',
      description: t('domainInventoryDesc'),
      defaultBulletPoints: [
        t('bulletInventory1'),
        t('bulletInventory2'),
        t('bulletInventory3'),
        t('bulletInventory4'),
      ],
      recommendedAttendees: [
        t('attendeeWarehouseManager'),
        t('attendeeInventoryController'),
        t('attendeeLogisticsCoordinator'),
      ],
      isDefault: true,
    },
    {
      id: 'production',
      name: t('domainProduction'),
      icon: 'fa-industry',
      description: t('domainProductionDesc'),
      defaultBulletPoints: [
        t('bulletProduction1'),
        t('bulletProduction2'),
        t('bulletProduction3'),
        t('bulletProduction4'),
      ],
      recommendedAttendees: [
        t('attendeeProductionManager'),
        t('attendeeProductionPlanner'),
        t('attendeeShopFloorSupervisor'),
      ],
      isDefault: true,
    },
    {
      id: 'cutting',
      name: t('domainCutting'),
      icon: 'fa-scissors',
      description: t('domainCuttingDesc'),
      defaultBulletPoints: [
        t('bulletCutting1'),
        t('bulletCutting2'),
        t('bulletCutting3'),
        t('bulletCutting4'),
      ],
      recommendedAttendees: [
        t('attendeeProductionManager'),
        t('attendeeQualityManager'),
        t('attendeeProcessEngineer'),
      ],
      isDefault: true,
    },
    {
      id: 'finance',
      name: t('domainFinance'),
      icon: 'fa-calculator',
      description: t('domainFinanceDesc'),
      defaultBulletPoints: [
        t('bulletFinance1'),
        t('bulletFinance2'),
        t('bulletFinance3'),
        t('bulletFinance4'),
      ],
      recommendedAttendees: [
        t('attendeeFinanceManager'),
        t('attendeeController'),
        t('attendeeAPARSpecialist'),
      ],
      isDefault: true,
    },
    {
      id: 'sales',
      name: t('domainSales'),
      icon: 'fa-chart-line',
      description: t('domainSalesDesc'),
      defaultBulletPoints: [
        t('bulletSales1'),
        t('bulletSales2'),
        t('bulletSales3'),
        t('bulletSales4'),
      ],
      recommendedAttendees: [
        t('attendeeSalesManager'),
        t('attendeeCustomerServiceRep'),
        t('attendeeLogisticsCoordinator'),
      ],
      isDefault: true,
    },
    {
      id: 'livestock',
      name: t('domainLivestock'),
      icon: 'fa-cow',
      description: t('domainLivestockDesc'),
      defaultBulletPoints: [
        t('bulletLivestock1'),
        t('bulletLivestock2'),
        t('bulletLivestock3'),
        t('bulletLivestock4'),
      ],
      recommendedAttendees: [
        t('attendeeLivestockManager'),
        t('attendeeGradingSpecialist'),
        t('attendeeProducerRelationsManager'),
      ],
      isDefault: true,
    },
    {
      id: 'debrief',
      name: t('domainDebrief'),
      icon: 'fa-clipboard-check',
      description: t('domainDebriefDesc'),
      defaultBulletPoints: [
        t('bulletDebrief1'),
        t('bulletDebrief2'),
        t('bulletDebrief3'),
        t('bulletDebrief4'),
      ],
      recommendedAttendees: [
        t('attendeeDebriefProjectLead'),
        t('attendeeDebriefTeamLead'),
      ],
      isDefault: true,
    },
    {
      id: 'qa',
      name: t('domainQA'),
      icon: 'fa-magnifying-glass',
      description: t('domainQADesc'),
      defaultBulletPoints: [
        t('bulletQA1'),
        t('bulletQA2'),
        t('bulletQA3'),
        t('bulletQA4'),
      ],
      recommendedAttendees: [],
      isDefault: true,
    },
    {
      id: 'maintenance',
      name: t('domainMaintenance'),
      icon: 'fa-wrench',
      description: t('domainMaintenanceDesc'),
      defaultBulletPoints: [
        t('bulletMaintenance1'),
        t('bulletMaintenance2'),
        t('bulletMaintenance3'),
        t('bulletMaintenance4'),
      ],
      recommendedAttendees: [],
      isDefault: true,
    },
    {
      id: 'travel',
      name: t('domainTravel'),
      icon: 'fa-plane',
      description: t('domainTravelDesc'),
      defaultBulletPoints: [],
      recommendedAttendees: [],
      isDefault: true,
    },
    {
      id: 'kickoff',
      name: t('domainKickoff'),
      icon: 'fa-flag',
      description: t('domainKickoffDesc'),
      defaultBulletPoints: [],
      recommendedAttendees: [],
      isDefault: true,
    },
    {
      id: 'plant-tour',
      name: t('domainPlantTour'),
      icon: 'fa-person-walking',
      description: t('domainPlantTourDesc'),
      defaultBulletPoints: [
        t('bulletPlantTour1'),
        t('bulletPlantTour2'),
        t('bulletPlantTour3'),
        t('bulletPlantTour4'),
        t('bulletPlantTour5'),
      ],
      recommendedAttendees: [
        t('attendeePlantManager'),
        t('attendeeProductionSupervisor'),
        t('attendeeWarehouseManager'),
      ],
      isDefault: true,
    },
  ];
}
