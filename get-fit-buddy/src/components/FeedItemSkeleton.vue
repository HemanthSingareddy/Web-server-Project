
<template>
  <article class="box">
    <div class="media">
      <div class="media-content">
        <div class="content">
          <!-- Name skeleton -->
          <p class="mb-2">
            <span class="skeleton skeleton-text" style="display: inline-block; width: 30%; min-height: 1.25rem;"></span>
          </p>

          <!-- Exercise type and action skeleton -->
          <p class="mb-2">
            <span class="skeleton skeleton-text" style="display: inline-block; width: 60%; min-height: 1rem;"></span>
          </p>

          <!-- Date and duration skeleton -->
          <p class="mb-2">
            <small>
              <span class="skeleton skeleton-text" style="display: inline-block; width: 40%; min-height: 0.875rem;"></span>
            </small>
          </p>

          <!-- Notes skeleton (optional) -->
          <p>
            <span class="skeleton skeleton-text" style="display: inline-block; width: 70%; min-height: 1rem;"></span>
          </p>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Skeleton loading animation */
.skeleton {
  background-color: #e0e0e0;
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.5) 60%,
    rgba(255, 255, 255, 0)
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: calc(200% + 200px) 0;
  }
}

.skeleton-text {
  display: block;
  height: 1rem;
  border-radius: 4px;
}
</style>