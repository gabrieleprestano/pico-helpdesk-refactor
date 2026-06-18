import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Container } from '../../layout/container/container';
import { TicketsService } from '../../services/tickets.service';
import { CommonModule } from '@angular/common';
import { TicketStatus } from '../../models/types/tickets.types';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../core/header/header';
import { TicketCard } from '../../shared/ticket-card/ticket-card';
import { TicketSkeletonCard } from '../../shared/ticket-skeleton-card/ticket-skeleton-card';
import { TicketSkeletonDetail } from '../../shared/ticket-skeleton-detail/ticket-skeleton-detail';

@Component({
  selector: 'app-tickets',
  imports: [
    Container,
    CommonModule,
    RouterOutlet,
    Header,
    RouterModule,
    TicketCard,
    TicketSkeletonCard,
    TicketSkeletonDetail,
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets implements OnInit, OnDestroy {
  protected ticketsService = inject(TicketsService);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);

  tickets = this.ticketsService.filteredTickets;
  isLoading = this.ticketsService.isLoadingTickets;
  error = this.ticketsService.ticketsErrorMessage;

  statistics = this.ticketsService.statistics;
  filters = this.ticketsService.filtriStati;

  hasClickedTicket = this.ticketsService.hasClickedTicket;

  // Pagination
  currentPage = signal<number>(1);
  readonly TICKETS_PER_PAGE = 8;

  readonly skip = computed(() => (this.currentPage() - 1) * this.TICKETS_PER_PAGE);
  readonly totalPages = computed(() => {
    const totalTickets = this.tickets().length;
    return Math.ceil(totalTickets / this.TICKETS_PER_PAGE);
  });

  // Effect to handle automatic navigation to the first ticket when the component is initialized and there are tickets available, but no specific ticket is selected yet.
  constructor() {
    effect(() => {
      const ticketsList = this.ticketsService.tickets()?.sort((a, b) => new Date(b.dataCreazione).getTime() - new Date(a.dataCreazione).getTime());
      const currentTicketID = this.ticketsService.ticketId();

      if (ticketsList && ticketsList.length > 0 && !currentTicketID) {
        const firstTicketID = ticketsList[0]._id;

        this.router.navigate([`ticket/${firstTicketID}`], {
          relativeTo: this.route,
          replaceUrl: true
        });
      }
    });
  }

  goToPreviousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  goToNextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  deselectTicket() {
    this.ticketsService.deselectTicket();
  }

  toggleStatusFilter(status: TicketStatus) {
    this.ticketsService.toggleStatusFilter(status);
  }

  isSelectedStatus(status: TicketStatus) {
    return this.ticketsService.activeTicketStatusFilters().includes(status);
  }

  ngOnInit(): void {
    this.ticketsService.startTicketChangeStream();
  }

  ngOnDestroy(): void {
    this.ticketsService.stopTicketsChangeStream();
  }
}
