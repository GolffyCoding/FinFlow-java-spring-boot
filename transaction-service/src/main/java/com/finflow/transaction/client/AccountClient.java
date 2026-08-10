package com.finflow.transaction.client;

import com.finflow.shared.dto.AmountRequest;
import com.finflow.shared.dto.TransferRequest;
import com.finflow.shared.dto.TransferResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "account-service", path = "/api/accounts")
public interface AccountClient {
    @PostMapping("/transfer")
    TransferResult transfer(@RequestBody TransferRequest request);
    @PostMapping("/deposit")
    TransferResult deposit(@RequestBody AmountRequest request);
    @PostMapping("/withdraw")
    TransferResult withdraw(@RequestBody AmountRequest request);
}
