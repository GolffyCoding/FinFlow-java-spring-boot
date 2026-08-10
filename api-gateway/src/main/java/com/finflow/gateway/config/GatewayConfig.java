package com.finflow.gateway.config;

import com.finflow.gateway.filter.JwtAuthenticationFilter;
import com.finflow.gateway.filter.RateLimitingFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;

    public GatewayConfig(JwtAuthenticationFilter jwtAuthenticationFilter, RateLimitingFilter rateLimitingFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitingFilter = rateLimitingFilter;
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("auth-service", r -> r.path("/api/auth/**")
                .filters(f -> f.filter(rateLimitingFilter.apply(new RateLimitingFilter.Config())))
                .uri("lb://auth-service"))
            .route("account-service", r -> r.path("/api/accounts/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://account-service"))
            .route("transaction-service", r -> r.path("/api/transactions/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://transaction-service"))
            .route("fraud-service", r -> r.path("/api/fraud/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://fraud-service"))
            .route("notification-service", r -> r.path("/api/notifications/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://notification-service"))
            .route("audit-service", r -> r.path("/api/audit/**")
                .filters(f -> f
                    .filter(rateLimitingFilter.apply(new RateLimitingFilter.Config()))
                    .filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("lb://audit-service"))
            .build();
    }
}
