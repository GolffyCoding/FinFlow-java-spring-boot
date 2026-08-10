package com.finflow.auth.controller;

import com.finflow.auth.security.JwtUtil;
import com.finflow.auth.service.AuthService;
import com.finflow.shared.dto.AuthRequest;
import com.finflow.shared.dto.AuthResponse;
import com.finflow.shared.exception.BadRequestException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtUtil jwtUtil;
    public AuthController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("X-Refresh-Token") String refreshToken) {
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader,
                                       @RequestHeader("X-Refresh-Token") String refreshToken) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BadRequestException("Missing or invalid Authorization header");
        }
        Long userId = jwtUtil.getUserIdFromToken(authHeader.substring(7));
        authService.logout(userId, refreshToken);
        return ResponseEntity.noContent().build();
    }
}
