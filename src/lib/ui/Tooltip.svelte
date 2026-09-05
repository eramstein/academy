<script lang="ts">
  import {
    computePosition,
    flip,
    shift,
    offset,
    type Placement,
    type Strategy,
  } from '@floating-ui/dom';
  import { onDestroy } from 'svelte';

  let {
    content,
    placement = 'top' as Placement,
    strategy = 'fixed' as Strategy,
    offsetValue = 8,
    show = false,
    children,
  } = $props<{
    content: string;
    placement?: Placement;
    strategy?: Strategy;
    offsetValue?: number;
    show?: boolean;
    children?: any;
  }>();

  let referenceElement = $state<HTMLElement>();

  function showTooltip() {
    if (!referenceElement) return;

    const portal = document.getElementById('tooltip-portal');
    if (!portal) return;

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = content;
    tooltip.setAttribute('role', 'tooltip');

    // Add to portal
    portal.appendChild(tooltip);

    // Position the tooltip
    computePosition(referenceElement, tooltip, {
      placement,
      strategy,
      middleware: [offset(offsetValue), flip(), shift({ padding: 8 })],
    }).then(({ x, y, placement: computedPlacement }) => {
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.setAttribute('data-popper-placement', computedPlacement);
    });

    // Store reference for cleanup
    (referenceElement as any)._tooltip = tooltip;
  }

  function hideTooltip() {
    if (!referenceElement) return;

    const tooltip = (referenceElement as any)._tooltip;
    if (tooltip && tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
      (referenceElement as any)._tooltip = null;
    }
  }

  $effect(() => {
    if (show) {
      showTooltip();
    } else {
      hideTooltip();
    }
  });

  onDestroy(() => {
    hideTooltip();
  });
</script>

<div bind:this={referenceElement} class="tooltip-reference">{@render children?.()}</div>

<style>
  .tooltip-reference {
    display: inline-block;
  }

  :global(.tooltip) {
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    max-width: 300px;
    min-width: 200px;
    text-align: center;
    z-index: 999999;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    border: 1px solid var(--color-golden);
    white-space: normal;
    word-wrap: break-word;
    line-height: 1.3;
    position: fixed;
  }
</style>
