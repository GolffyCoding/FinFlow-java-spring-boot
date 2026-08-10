package com.finflow.auth.service;

import com.finflow.auth.entity.RefreshToken;
import com.finflow.auth.entity.Role;
import com.finflow.auth.entity.User;
import com.finflow.auth.repository.RefreshTokenRepository;
import com.finflow.auth.repository.UserRepository;
import com.finflow.auth.security.JwtUtil;
import com.finflow.shared.dto.AuthRequest;
import com.finflow.shared.dto.AuthResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    public AuthService(AuthenticationManager authenticationManager, UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository, JwtUtil jwtUtil,
                       PasswordEncoder passwordEncoder, StringRedisTemplate redisTemplate) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        String rateLimitKey = "login_attempts:" + request.getUsername();
        String attempts = redisTemplate.opsForValue().get(rateLimitKey);
        if (attempts != null && Integer.parseInt(attempts) >= 5) {
            throw new BadCredentialsException("Account temporarily locked due to too many failed attempts");
        }
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
            user.setFailedAttempts(0);
            user.setLastLogin(Instant.now().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime());
            userRepository.save(user);
            redisTemplate.delete(rateLimitKey);

            Set<String> roles = user.getRoles().stream().map(Role::name).collect(Collectors.toSet());
            String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), roles);
            String refreshToken = createRefreshToken(user.getId());

            return new AuthResponse(accessToken, refreshToken, 900L);
        } catch (BadCredentialsException e) {
            redisTemplate.opsForValue().increment(rateLimitKey);
            redisTemplate.expire(rateLimitKey, Duration.ofMinutes(15));
            User user = userRepository.findByUsername(request.getUsername()).orElse(null);
            if (user != null) {
                user.setFailedAttempts(user.getFailedAttempts() + 1);
                if (user.getFailedAttempts() >= 5) {
                    user.setLocked(true);
                }
                userRepository.save(user);
            }
            throw e;
        }
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
            .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
        if (token.getRevoked() || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Refresh token expired or revoked");
        }
        User user = userRepository.findById(token.getUserId())
            .orElseThrow(() -> new BadCredentialsException("User not found"));
        Set<String> roles = user.getRoles().stream().map(Role::name).collect(Collectors.toSet());
        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), roles);
        // createRefreshToken() deletes all existing tokens for this user (including this one)
        // before issuing a new one, so there is nothing left to separately revoke here.
        String newRefreshToken = createRefreshToken(user.getId());
        return new AuthResponse(newAccessToken, newRefreshToken, 900L);
    }

    @Transactional
    public void logout(Long userId, String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken).orElse(null);
        if (token != null) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        }
        refreshTokenRepository.deleteByUserId(userId);
        redisTemplate.opsForValue().set("blacklist:token:" + refreshToken, "revoked", Duration.ofDays(7));
    }

    private String createRefreshToken(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(LocalDateTime.now().plusSeconds(604800));
        token.setRevoked(false);
        refreshTokenRepository.save(token);
        return token.getToken();
    }
}
