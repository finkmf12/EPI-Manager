package com.visage.epimanager.config;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfiguration {

    @Bean
    SecurityFilterChain apiSecurityFilterChain(
            HttpSecurity http,
            Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
            @Value("${app.docs.public:false}") boolean docsPublic,
            @Value("${app.registration.enabled:false}") boolean registrationEnabled) throws Exception {

        http
                .cors(cors -> { })
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> {
                    authorize.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                            .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                            .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll();
                    if (registrationEnabled) {
                        authorize.requestMatchers(HttpMethod.POST, "/api/v1/auth/register-company").permitAll();
                    } else {
                        authorize.requestMatchers(HttpMethod.POST, "/api/v1/auth/register-company").denyAll();
                    }
                    if (docsPublic) {
                        authorize.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**").permitAll();
                    } else {
                        authorize.requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**")
                                .hasAuthority("TOKEN_ACCESS");
                    }
                    authorize.requestMatchers(HttpMethod.POST, "/api/v1/auth/select-company")
                            .hasAuthority("TOKEN_COMPANY_SELECTION")
                            .requestMatchers("/api/v1/auth/**").hasAuthority("TOKEN_ACCESS")
                            .anyRequest().hasAuthority("TOKEN_ACCESS");
                })
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)));

        return http.build();
    }

    @Bean
    Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            String tokenType = jwt.getClaimAsString("token_type");
            Collection<GrantedAuthority> authorities = new java.util.ArrayList<>();

            if ("COMPANY_SELECTION".equals(tokenType)) {
                authorities.add(new SimpleGrantedAuthority("TOKEN_COMPANY_SELECTION"));
            } else if ("ACCESS".equals(tokenType)) {
                authorities.add(new SimpleGrantedAuthority("TOKEN_ACCESS"));
                String profile = jwt.getClaimAsString("company_profile");
                if (profile != null && !profile.isBlank()) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + profile));
                }
                if ("ADMIN_PLATAFORMA".equals(jwt.getClaimAsString("global_role"))) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN_PLATAFORMA"));
                }
            }

            return new JwtAuthenticationToken(jwt, authorities, jwt.getClaimAsString("email"));
        };
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID"));
        configuration.setExposedHeaders(List.of("X-Request-ID"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
