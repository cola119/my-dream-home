class RealEstateCalculator {
    constructor() {
        this.form = document.getElementById('propertyForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.budgetInput = document.getElementById('budget');
        this.loanPeriodInput = document.getElementById('loanPeriod');
        this.downPaymentInput = document.getElementById('downPayment');
        this.variableRateInput = document.getElementById('variableRate');
        this.fixedRateInput = document.getElementById('fixedRate');
        this.variableScenarioSelect = document.getElementById('variableScenario');
        this.maxRateInput = document.getElementById('maxRate');
        this.simulationDetails = document.getElementById('simulationDetails');
        this.scenarioDescription = document.getElementById('scenarioDescription');
        this.chartToggle = document.getElementById('chartToggle');
        this.dualToggle = document.getElementById('dualToggle');
        this.tableToggle = document.getElementById('tableToggle');
        this.chartContainer = document.getElementById('chartContainer');
        this.tableContainer = document.getElementById('tableContainer');
        this.comparisonTableBody = document.getElementById('comparisonTableBody');
        this.currentChartView = 'chart';
        this.squareMetersInput = document.getElementById('squareMeters');
        this.tsuboSizeInput = document.getElementById('tsuboSize');
        this.pricePerTsuboInput = document.getElementById('pricePerTsubo');
        this.monthlyPaymentInput = document.getElementById('monthlyPayment');
        this.homeTypeInputs = document.querySelectorAll('input[name="homeType"]');
        this.propertyTypeSelect = document.getElementById('propertyType');
        this.loanTypeSelect = document.getElementById('loanType');
        this.pairLoanSettings = document.getElementById('pairLoanSettings');
        this.husbandRatioInput = document.getElementById('husbandRatio');
        this.wifeRatioInput = document.getElementById('wifeRatio');
        this.saleYearInput = document.getElementById('saleYear');
        this.salePriceInput = document.getElementById('salePrice');
        this.saleResults = document.getElementById('saleResults');
        this.isUpdating = false;
        this.lastUpdatedField = null;
        this.init();
    }

    init() {
        // URLからパラメータを読み込み
        this.loadFromURL();
        
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (!['budget', 'squareMeters', 'tsuboSize', 'pricePerTsubo', 'monthlyPayment'].includes(input.id)) {
                input.addEventListener('input', () => {
                    this.calculateAndDisplay();
                });
            }
        });

        const budgetButtons = document.querySelectorAll('.budget-btn');
        budgetButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = parseInt(button.dataset.amount);
                this.budgetInput.value = amount;
                
                budgetButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                this.handleBudgetInput();
            });
        });

        this.budgetInput.addEventListener('input', () => {
            this.handleBudgetInput();
        });

        this.loanPeriodInput.addEventListener('input', () => {
            this.calculateAndDisplay();
        });

        this.downPaymentInput.addEventListener('input', () => {
            this.calculateAndDisplay();
        });

        this.variableRateInput.addEventListener('input', () => {
            this.calculateAndDisplay();
        });

        this.fixedRateInput.addEventListener('input', () => {
            this.calculateAndDisplay();
        });


        this.variableScenarioSelect.addEventListener('change', () => {
            this.handleScenarioChange();
        });

        this.maxRateInput.addEventListener('input', () => {
            this.calculateAndDisplay();
        });

        this.chartToggle.addEventListener('click', () => {
            this.switchView('chart');
        });

        this.dualToggle.addEventListener('click', () => {
            this.switchView('dual');
        });

        this.tableToggle.addEventListener('click', () => {
            this.switchView('table');
        });

        this.squareMetersInput.addEventListener('input', () => {
            this.handleAreaInput('squareMeters');
        });

        this.tsuboSizeInput.addEventListener('input', () => {
            this.handleAreaInput('tsuboSize');
        });

        this.pricePerTsuboInput.addEventListener('input', () => {
            this.handlePricePerTsuboInput();
        });

        this.monthlyPaymentInput.addEventListener('input', () => {
            this.handleMonthlyPaymentInput();
        });

        this.homeTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.calculateAndDisplay();
            });
        });

        this.propertyTypeSelect.addEventListener('change', () => {
            this.calculateAndDisplay();
        });

        this.loanTypeSelect.addEventListener('change', () => {
            this.handleLoanTypeChange();
        });

        this.husbandRatioInput.addEventListener('input', () => {
            this.handleRatioChange('husband');
        });

        this.wifeRatioInput.addEventListener('input', () => {
            this.handleRatioChange('wife');
        });

        this.saleYearInput.addEventListener('input', () => {
            this.calculateSaleSimulation();
        });

        this.salePriceInput.addEventListener('input', () => {
            this.calculateSaleSimulation();
        });

        // 売却価格ボタンのイベントリスナー
        const salePriceButtons = document.querySelectorAll('.sale-price-btn');
        salePriceButtons.forEach(button => {
            button.addEventListener('click', () => {
                const rate = parseInt(button.dataset.rate);
                this.handleSalePriceButton(rate);
                
                salePriceButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // 物件購入リンクのイベントリスナー
        const propertyLinks = document.querySelectorAll('.prefecture-link');
        propertyLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePropertyLinkClick(e.currentTarget);
            });
        });

        this.initializeDefaults();
        this.updateScenarioDescription('fixed'); // 初期状態の解説を設定
        this.calculateAndDisplay();
    }

    initializeDefaults() {
        if (this.squareMetersInput.value) {
            const squareMeters = parseFloat(this.squareMetersInput.value);
            if (squareMeters > 0) {
                const convertedTsubo = squareMeters / 3.3058;
                this.tsuboSizeInput.value = convertedTsubo.toFixed(1);
            }
        }
    }

    handlePropertyLinkClick(linkElement) {
        const prefecture = linkElement.dataset.prefecture;
        
        // 現在の計算結果から価格を取得
        const data = this.getFormData();
        const purchasePrice = this.calculatePurchasePrice(data);
        
        if (purchasePrice === 0) {
            alert('まず予算を入力してください');
            return;
        }
        
        // 価格を適切な範囲に丸める（REHOUSEのURLに合わせて）
        const roundedPrice = this.roundPriceForUrl(purchasePrice);
        
        // REHOUSEの物件検索URLを構築
        const baseUrl = 'https://www.rehouse.co.jp/buy/theme/price';
        const url = `${baseUrl}/${roundedPrice}/mansion/prefecture-list/${prefecture}/`;
        
        // 新しいタブで開く
        window.open(url, '_blank');
        
        // アナリティクス用（オプション）
        if (typeof gtag !== 'undefined') {
            gtag('event', 'property_link_click', {
                'prefecture': prefecture,
                'price_range': roundedPrice,
                'calculated_price': purchasePrice,
                'event_category': 'external_link'
            });
        }
    }

    roundPriceForUrl(price) {
        // REHOUSEのURLで使用される価格帯に丸める
        if (price <= 3000) return 3000;
        else if (price <= 4000) return 4000;
        else if (price <= 5000) return 5000;
        else if (price <= 6000) return 6000;
        else if (price <= 7000) return 7000;
        else if (price <= 8000) return 8000;
        else if (price <= 9000) return 9000;
        else if (price <= 10000) return 10000;
        else if (price <= 12000) return 12000;
        else if (price <= 15000) return 15000;
        else return 15000; // 上限
    }

    updatePropertyLinks(purchasePrice) {
        const priceElements = [
            'tokyoPrice',
            'kanagawaPrice', 
            'saitamaPrice',
            'chibaPrice'
        ];
        
        if (purchasePrice > 0) {
            const formattedPrice = `${this.formatNumber(purchasePrice)}万円で探す`;
            priceElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = formattedPrice;
                }
            });
        } else {
            priceElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = '価格を入力してください';
                }
            });
        }
    }

    getSelectedHomeType() {
        const checkedInput = document.querySelector('input[name="homeType"]:checked');
        return checkedInput ? checkedInput.value : 'energy-efficient';
    }

    handleLoanTypeChange() {
        const loanType = this.loanTypeSelect.value;
        const loanTypeItem = document.querySelector('.loan-type-item');
        
        if (loanType === 'pair') {
            this.pairLoanSettings.style.display = 'block';
            this.showPairLoanDetails(true);
            loanTypeItem.classList.add('pair-selected');
        } else {
            this.pairLoanSettings.style.display = 'none';
            this.showPairLoanDetails(false);
            loanTypeItem.classList.remove('pair-selected');
        }
        this.calculateAndDisplay();
    }

    handleRatioChange(person) {
        const husbandRatio = parseFloat(this.husbandRatioInput.value) || 0;
        const wifeRatio = parseFloat(this.wifeRatioInput.value) || 0;
        const total = husbandRatio + wifeRatio;
        
        if (total !== 100 && total > 0) {
            if (person === 'husband') {
                this.wifeRatioInput.value = Math.max(0, 100 - husbandRatio);
            } else {
                this.husbandRatioInput.value = Math.max(0, 100 - wifeRatio);
            }
        }
        
        this.calculateAndDisplay();
    }

    showPairLoanDetails(show) {
        const pairDetailsElements = [
            'variablePairDetails',
            'fixedPairDetails',
        ];
        
        pairDetailsElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = show ? 'block' : 'none';
            }
        });
    }

    isPairLoan() {
        return this.loanTypeSelect.value === 'pair';
    }

    getPairLoanRatios() {
        return {
            husband: parseFloat(this.husbandRatioInput.value) || 60,
            wife: parseFloat(this.wifeRatioInput.value) || 40
        };
    }

    handleBudgetInput() {
        if (this.isUpdating) return;
        this.lastUpdatedField = 'budget';
        this.clearOtherInputs('budget');
        this.updateBudgetButtonsState();
        this.updateLinkedFields();
        this.saveToURL();
    }

    updateBudgetButtonsState() {
        const currentBudget = parseInt(this.budgetInput.value);
        const budgetButtons = document.querySelectorAll('.budget-btn');
        
        budgetButtons.forEach(button => {
            const buttonAmount = parseInt(button.dataset.amount);
            if (buttonAmount === currentBudget) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    handlePricePerTsuboInput() {
        if (this.isUpdating) return;
        this.lastUpdatedField = 'pricePerTsubo';
        this.clearOtherInputs('pricePerTsubo');
        this.updateLinkedFields();
    }

    handleMonthlyPaymentInput() {
        if (this.isUpdating) return;
        this.lastUpdatedField = 'monthlyPayment';
        this.updateFromMonthlyPayment();
    }

    updateFromMonthlyPayment() {
        const monthlyPayment = parseFloat(this.monthlyPaymentInput.value) || 0;
        
        if (monthlyPayment > 0) {
            this.isUpdating = true;
            
            // デフォルト値で借入可能額を計算
            const loanPeriod = parseFloat(this.loanPeriodInput.value) || 35;
            const downPayment = parseFloat(this.downPaymentInput.value) || 0;
            const interestRate = 1.0; // デフォルト金利1.0%
            
            const monthlyRate = interestRate / 100 / 12;
            const totalPayments = loanPeriod * 12;
            const monthlyPaymentYen = monthlyPayment * 10000; // 万円を円に変換
            
            let maxLoanAmount;
            if (monthlyRate === 0) {
                maxLoanAmount = monthlyPaymentYen * totalPayments;
            } else {
                maxLoanAmount = (monthlyPaymentYen * (Math.pow(1 + monthlyRate, totalPayments) - 1)) / 
                               (monthlyRate * Math.pow(1 + monthlyRate, totalPayments));
            }
            
            const downPaymentYen = downPayment * 10000; // 万円を円に変換
            const purchasePrice = (maxLoanAmount + downPaymentYen) / 10000; // 円を万円に変換
            this.budgetInput.value = Math.round(purchasePrice);
            
            // デフォルトの面積から坪単価を計算して連動
            const defaultSquareMeters = 70; // デフォルト70平米
            const defaultTsubo = defaultSquareMeters / 3.3058;
            const calculatedPricePerTsubo = purchasePrice / defaultTsubo;
            
            this.squareMetersInput.value = defaultSquareMeters;
            this.tsuboSizeInput.value = defaultTsubo.toFixed(1);
            this.pricePerTsuboInput.value = Math.round(calculatedPricePerTsubo);
            
            this.isUpdating = false;
        }
        
        this.calculateAndDisplay();
    }

    clearOtherInputs(currentField) {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        
        if (currentField !== 'budget') {
            this.budgetInput.value = '';
            this.updateBudgetButtonsState();
        }
        if (currentField !== 'monthlyPayment') {
            this.monthlyPaymentInput.value = '';
        }
        if (currentField !== 'pricePerTsubo') {
            // 坪単価フィールドはクリアしない（面積計算との連動のため）
        }
        
        this.isUpdating = false;
    }

    handleAreaInput(inputType) {
        if (this.isUpdating) return;
        
        const squareMeters = parseFloat(this.squareMetersInput.value) || 0;
        const tsuboSize = parseFloat(this.tsuboSizeInput.value) || 0;
        
        this.isUpdating = true;
        
        if (inputType === 'squareMeters' && squareMeters > 0) {
            const convertedTsubo = squareMeters / 3.3058;
            this.tsuboSizeInput.value = convertedTsubo.toFixed(1);
        } else if (inputType === 'tsuboSize' && tsuboSize > 0) {
            const convertedSquareMeters = tsuboSize * 3.3058;
            this.squareMetersInput.value = convertedSquareMeters.toFixed(1);
        }
        
        this.isUpdating = false;
        this.updateLinkedFieldsOnAreaChange();
        this.calculateAndDisplay();
    }

    updateLinkedFields() {
        if (this.isUpdating) return;
        
        const budget = parseFloat(this.budgetInput.value) || 0;
        const pricePerTsubo = parseFloat(this.pricePerTsuboInput.value) || 0;
        const tsuboSize = this.getCurrentTsuboSize();
        
        if (tsuboSize > 0) {
            this.isUpdating = true;
            
            if (this.lastUpdatedField === 'budget' && budget > 0) {
                const calculatedPricePerTsubo = budget / tsuboSize;
                this.pricePerTsuboInput.value = calculatedPricePerTsubo.toFixed(1);
            } else if (this.lastUpdatedField === 'pricePerTsubo' && pricePerTsubo > 0) {
                const calculatedBudget = pricePerTsubo * tsuboSize;
                this.budgetInput.value = Math.round(calculatedBudget);
            }
            
            this.isUpdating = false;
        }
        
        this.calculateAndDisplay();
    }

    updateLinkedFieldsOnAreaChange() {
        const budget = parseFloat(this.budgetInput.value) || 0;
        const tsuboSize = this.getCurrentTsuboSize();
        
        if (budget > 0 && tsuboSize > 0) {
            this.isUpdating = true;
            const calculatedPricePerTsubo = budget / tsuboSize;
            this.pricePerTsuboInput.value = calculatedPricePerTsubo.toFixed(1);
            this.isUpdating = false;
        }
    }

    getCurrentTsuboSize() {
        const tsuboSize = parseFloat(this.tsuboSizeInput.value) || 0;
        const squareMeters = parseFloat(this.squareMetersInput.value) || 0;
        
        if (tsuboSize > 0) {
            return tsuboSize;
        } else if (squareMeters > 0) {
            return squareMeters / 3.3058;
        }
        return 0;
    }

    getFormData() {
        return {
            budget: parseFloat(this.budgetInput.value) || 0,
            pricePerTsubo: parseFloat(this.pricePerTsuboInput.value) || 0,
            squareMeters: parseFloat(this.squareMetersInput.value) || 0,
            tsuboSize: parseFloat(this.tsuboSizeInput.value) || 0,
            loanPeriod: parseFloat(this.loanPeriodInput.value) || 35,
            downPayment: parseFloat(this.downPaymentInput.value) || 0,
        };
    }

    calculatePurchasePrice(data) {
        if (data.budget > 0) {
            return data.budget;
        }
        if (data.pricePerTsubo > 0 && data.tsuboSize > 0) {
            return data.pricePerTsubo * data.tsuboSize;
        }
        if (data.pricePerTsubo > 0 && data.squareMeters > 0) {
            const tsuboFromSquareMeters = data.squareMeters / 3.3058;
            return data.pricePerTsubo * tsuboFromSquareMeters;
        }
        return 0;
    }

    calculateLoanDetails(purchasePrice, downPayment, interestRate, loanPeriod) {
        const loanAmount = purchasePrice - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanPeriod * 12;
        
        if (monthlyRate === 0) {
            return {
                loanAmount: loanAmount,
                monthlyPayment: loanAmount / totalPayments,
                totalPayment: loanAmount + downPayment,
                totalInterest: 0
            };
        }

        const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
            (Math.pow(1 + monthlyRate, totalPayments) - 1);

        const totalPayment = monthlyPayment * totalPayments;
        const totalInterest = totalPayment - loanAmount;

        return {
            loanAmount: loanAmount,
            monthlyPayment: monthlyPayment,
            totalPayment: totalPayment + downPayment,
            totalInterest: totalInterest
        };
    }

    calculateMaintenanceCosts(purchasePrice) {
        // 固定資産税の計算（軽減措置考慮）
        // 評価額を購入価格の70%と仮定
        const assessedValue = purchasePrice * 0.7;
        
        // 新築住宅の軽減措置：
        // - 一戸建て：3年間、床面積120㎡まで税額1/2軽減
        // - マンション：5年間、床面積120㎡まで税額1/2軽減
        // ここでは平均的な軽減率を適用
        const propertyTaxRate = 0.014; // 1.4%
        const reductionRate = 0.5; // 50%軽減
        const propertyTax = assessedValue * propertyTaxRate * reductionRate;
        
        const cityPlanningTax = purchasePrice * 0.003; // 購入価格の0.3%（万円単位）
        const fireInsurance = 5; // 年間5万円
        const maintenanceFee = 30; // 年間10万円

        return {
            propertyTax: propertyTax,
            cityPlanningTax: cityPlanningTax,
            fireInsurance: fireInsurance,
            maintenanceFee: maintenanceFee
        };
    }

    calculateTransactionFees(purchasePrice, loanAmount, propertyType = 'existing', isPairLoan = false, ratios = null) {
        const formulas = {};
        
        // 1. 仲介手数料: 新築マンションでは不要、その他は(物件価格 × 3% + 6万円) × 1.1（消費税）
        let brokerageFee = 0;
        if (propertyType !== 'new-mansion') {
            brokerageFee = Math.min((purchasePrice * 0.03 + 6) * 1.1, purchasePrice * 0.033);
            formulas.brokerageFee = '(物件価格×3%+6万円)×1.1';
        } else {
            formulas.brokerageFee = '新築マンションのため不要';
        }
        
        // 2. 登録免許税
        const landValue = purchasePrice * 0.4; // 土地部分を40%と仮定
        const buildingValue = purchasePrice * 0.6; // 建物部分を60%と仮定
        const landRegistrationTax = landValue * 0.7 * 0.015; // 評価額7割で計算
        const buildingRegistrationTax = buildingValue * 0.7 * 0.003; // 評価額7割で計算
        const registrationTax = landRegistrationTax + buildingRegistrationTax;
        formulas.registrationTax = '土地1.5%+建物0.3%(評価額7割)';
        
        // 3. 司法書士報酬: ペアローンの場合は各自で必要
        let judicialScrivenerFee;
        if (isPairLoan) {
            // ペアローンの場合、各自に司法書士が必要（登記名義が2名のため）
            judicialScrivenerFee = 12.5 * 2;
            formulas.judicialScrivenerFee = '12.5万円×2名（夫婦各自）';
        } else {
            judicialScrivenerFee = 12.5;
            formulas.judicialScrivenerFee = '約12.5万円';
        }
        
        // 4. 不動産取得税: 評価額 × 3%（軽減措置考慮）
        const propertyAcquisitionTax = Math.max(0, (purchasePrice * 0.7 * 0.03) - 120);
        formulas.propertyAcquisitionTax = '評価額×3%-120万円';
        
        // 5. 印紙税: 契約金額に応じて
        let stampTax;
        if (purchasePrice <= 1000) stampTax = 1;
        else if (purchasePrice <= 5000) stampTax = 2;
        else if (purchasePrice <= 10000) stampTax = 6;
        else stampTax = 10;
        
        if (isPairLoan) {
            // ペアローンの場合、売買契約は1つだが、ローン契約は2つ
            const loanStampTax = this.calculateLoanStampTax(loanAmount, ratios);
            stampTax = stampTax + loanStampTax; // 売買契約印紙税 + ローン契約印紙税×2
            formulas.stampTax = '売買契約分+ローン契約分×2名';
        } else {
            const loanStampTax = this.calculateLoanStampTax(loanAmount);
            stampTax = stampTax + loanStampTax;
            formulas.stampTax = '売買契約分+ローン契約分';
        }
        
        // 6. ローン関連費用
        let loanFees = 0;
        if (loanAmount > 0) {
            if (isPairLoan && ratios) {
                // ペアローンの場合、各自が個別にローン契約するため2倍の手数料
                const husbandLoan = loanAmount * (ratios.husband / 100);
                const wifeLoan = loanAmount * (ratios.wife / 100);
                
                // 借入額に対する手数料（2.2%）
                const husbandProcessingFeeRate = husbandLoan * 0.022;
                const wifeProcessingFeeRate = wifeLoan * 0.022;
                
                // 固定事務手数料（55,000円 = 5.5万円）
                const fixedProcessingFee = 5.5; // 万円単位
                
                loanFees = husbandProcessingFeeRate + wifeProcessingFeeRate + (fixedProcessingFee * 2);
                formulas.loanFees = `借入額2.2%×2名+事務手数料5.5万円×2名`;
            } else {
                // 単独ローンの場合
                const loanProcessingFeeRate = loanAmount * 0.022;
                const fixedProcessingFee = 5.5; // 万円単位
                
                loanFees = loanProcessingFeeRate + fixedProcessingFee;
                formulas.loanFees = '借入額2.2%+事務手数料5.5万円';
            }
        } else {
            formulas.loanFees = 'ローンなしのため不要';
        }
        
        const totalFees = brokerageFee + registrationTax + judicialScrivenerFee + 
                         propertyAcquisitionTax + stampTax + loanFees;

        return {
            brokerageFee: brokerageFee,
            registrationTax: registrationTax,
            judicialScrivenerFee: judicialScrivenerFee,
            propertyAcquisitionTax: propertyAcquisitionTax,
            stampTax: stampTax,
            loanFees: loanFees,
            totalFees: totalFees,
            formulas: formulas,
            isPairLoan: isPairLoan
        };
    }

    calculateLoanStampTax(loanAmount, ratios = null) {
        // ローン契約の印紙税を計算
        let stampTax = 0;
        
        if (ratios) {
            // ペアローンの場合、各ローン契約金額に応じて
            const husbandLoan = (loanAmount / 10000) * (ratios.husband / 100); // 万円単位
            const wifeLoan = (loanAmount / 10000) * (ratios.wife / 100); // 万円単位
            
            stampTax += this.getStampTaxByAmount(husbandLoan);
            stampTax += this.getStampTaxByAmount(wifeLoan);
        } else {
            const loanAmountMan = loanAmount / 10000; // 万円単位
            stampTax = this.getStampTaxByAmount(loanAmountMan);
        }
        
        return stampTax;
    }

    getStampTaxByAmount(amountMan) {
        // 金額（万円）に応じた印紙税を計算
        if (amountMan <= 1000) return 1; // 1万円
        else if (amountMan <= 5000) return 2; // 2万円
        else if (amountMan <= 10000) return 6; // 6万円
        else return 10; // 10万円
    }

    calculateHousingLoanDeduction(loanAmount, loanPeriod, homeType = 'energy-efficient', interestRate = 1.0) {
        // 住宅の種類別借入限度額（万円）
        const borrowingLimits = {
            'certified': 5000,      // 認定住宅
            'zeh': 4500,           // ZEH水準省エネ住宅
            'energy-efficient': 4000, // 省エネ基準適合住宅
            'basic': 2000          // 一般住宅（2024年以降省エネ基準なし）
        };
        
        const deductionRate = 0.007; // 控除率0.7%
        const maxDeductionPeriod = homeType === 'basic' ? 10 : 13; // 控除期間
        const effectivePeriod = Math.min(loanPeriod, maxDeductionPeriod);
        const borrowingLimit = borrowingLimits[homeType] || borrowingLimits['energy-efficient'];
        
        // 実際の借入額と限度額の小さい方を採用
        const eligibleLoanAmount = Math.min(loanAmount, borrowingLimit);
        
        const deductionData = [];
        let remainingBalance = eligibleLoanAmount * 10000; // 円単位に変換
        
        // 簡易計算：元利均等返済での年末残高推移
        const monthlyRate = interestRate / 100 / 12; // 実際の金利を使用
        const totalPayments = loanPeriod * 12;
        const monthlyPayment = remainingBalance * 
            (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
            (Math.pow(1 + monthlyRate, totalPayments) - 1);
        
        let totalDeduction = 0;
        
        for (let year = 1; year <= effectivePeriod; year++) {
            // 前年末（当年始）の残高で控除額を計算
            const yearStartBalance = remainingBalance;
            
            // 年間控除額を計算（万円単位）
            const annualDeduction = Math.min(
                (yearStartBalance / 10000) * deductionRate, // 残高の0.7%
                40 // 年間最大控除額40万円
            );
            
            totalDeduction += annualDeduction;
            
            // 1年分の返済後の残高を計算
            for (let month = 1; month <= 12 && remainingBalance > 0; month++) {
                const interestPayment = remainingBalance * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                remainingBalance = Math.max(0, remainingBalance - principalPayment);
            }
            
            deductionData.push({
                year: year,
                balance: yearStartBalance / 10000, // 万円単位（年始残高）
                deduction: annualDeduction
            });
        }
        
        return {
            homeType: homeType,
            deductionPeriod: effectivePeriod,
            borrowingLimit: borrowingLimit,
            eligibleLoanAmount: eligibleLoanAmount,
            totalDeduction: totalDeduction,
            annualData: deductionData
        };
    }

    calculateSaleFees(salePrice) {
        // 売却手数料の計算
        // 仲介手数料: (売却価格 × 3% + 6万円) × 1.1（消費税）
        const brokerageFee = Math.min((salePrice * 0.03 + 6) * 1.1, salePrice * 0.033);
        
        // 印紙税（売買契約書）
        let stampTax;
        if (salePrice <= 1000) stampTax = 1;
        else if (salePrice <= 5000) stampTax = 2;
        else if (salePrice <= 10000) stampTax = 6;
        else stampTax = 10;
        
        // その他手数料（登記費用等）
        const otherFees = 5; // 約5万円
        
        const totalFees = brokerageFee + stampTax + otherFees;
        
        return {
            brokerageFee: brokerageFee,
            stampTax: stampTax,
            otherFees: otherFees,
            totalFees: totalFees
        };
    }

    calculateSaleSimulation() {
        const saleYear = parseInt(this.saleYearInput.value) || 0;
        const salePrice = parseFloat(this.salePriceInput.value) || 0;
        
        if (saleYear <= 0 || salePrice <= 0) {
            this.saleResults.style.display = 'none';
            return;
        }
        
        const data = this.getFormData();
        const purchasePrice = this.calculatePurchasePrice(data);
        
        if (purchasePrice === 0) {
            this.saleResults.style.display = 'none';
            return;
        }
        
        const variableRate = parseFloat(this.variableRateInput.value) || 0.8;
        const fixedRate = parseFloat(this.fixedRateInput.value) || 2.0;
        const loanAmount = (purchasePrice - data.downPayment) * 10000; // 円単位
        
        // 売却手数料を計算（共通）
        const saleFees = this.calculateSaleFees(salePrice);
        const saleNetPrice = salePrice - saleFees.totalFees;
        
        // 変動金利での計算
        const variableRemainingLoan = this.calculateRemainingLoan(loanAmount, variableRate, data.loanPeriod, saleYear);
        const variableTotalPaid = this.calculateTotalPaidAmount(loanAmount, variableRate, data.loanPeriod, saleYear);
        
        // 固定金利での計算
        const fixedRemainingLoan = this.calculateRemainingLoan(loanAmount, fixedRate, data.loanPeriod, saleYear);
        const fixedTotalPaid = this.calculateTotalPaidAmount(loanAmount, fixedRate, data.loanPeriod, saleYear);
        
        // 購入時手数料（共通）
        const propertyType = this.propertyTypeSelect.value;
        const isPairLoan = this.isPairLoan();
        const ratios = isPairLoan ? this.getPairLoanRatios() : null;
        const purchaseTransactionFees = this.calculateTransactionFees(purchasePrice, loanAmount / 10000, propertyType, isPairLoan, ratios);
        
        // 維持費累計（共通）
        const maintenanceCosts = this.calculateMaintenanceCosts(purchasePrice);
        const totalMaintenanceCosts = (maintenanceCosts.propertyTax + 
                                     maintenanceCosts.cityPlanningTax + 
                                     maintenanceCosts.fireInsurance + 
                                     maintenanceCosts.maintenanceFee) * saleYear;
        
        // 実質利益/損失を計算（変動金利）
        const variableTotalGainLoss = saleNetPrice - (variableRemainingLoan / 10000) - (variableTotalPaid.total / 10000) - 
                                     purchaseTransactionFees.totalFees - totalMaintenanceCosts;
        
        // 実質利益/損失を計算（固定金利）
        const fixedTotalGainLoss = saleNetPrice - (fixedRemainingLoan / 10000) - (fixedTotalPaid.total / 10000) - 
                                  purchaseTransactionFees.totalFees - totalMaintenanceCosts;
        
        // 結果を表示
        this.displaySaleSimulation({
            salePrice: salePrice,
            saleFees: saleFees.totalFees,
            saleNetPrice: saleNetPrice,
            purchaseFees: purchaseTransactionFees.totalFees,
            maintenanceTotal: totalMaintenanceCosts,
            variable: {
                remainingLoan: variableRemainingLoan / 10000,
                totalPaid: variableTotalPaid.total / 10000,
                principalPaid: variableTotalPaid.principal / 10000,
                interestPaid: variableTotalPaid.interest / 10000,
                totalGainLoss: variableTotalGainLoss
            },
            fixed: {
                remainingLoan: fixedRemainingLoan / 10000,
                totalPaid: fixedTotalPaid.total / 10000,
                principalPaid: fixedTotalPaid.principal / 10000,
                interestPaid: fixedTotalPaid.interest / 10000,
                totalGainLoss: fixedTotalGainLoss
            }
        });
    }

    calculateRemainingLoan(loanAmount, interestRate, loanPeriod, targetYear) {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanPeriod * 12;
        const targetMonths = targetYear * 12;
        
        if (monthlyRate === 0) {
            const monthlyPayment = loanAmount / totalPayments;
            return Math.max(0, loanAmount - (monthlyPayment * targetMonths));
        }
        
        const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
            (Math.pow(1 + monthlyRate, totalPayments) - 1);
        
        let remainingBalance = loanAmount;
        
        for (let month = 0; month < targetMonths && remainingBalance > 0; month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            remainingBalance = Math.max(0, remainingBalance - principalPayment);
        }
        
        return remainingBalance;
    }

    handleSalePriceButton(rate) {
        const data = this.getFormData();
        const purchasePrice = this.calculatePurchasePrice(data);
        
        if (purchasePrice > 0) {
            const adjustedPrice = Math.round(purchasePrice * (1 + rate / 100));
            this.salePriceInput.value = adjustedPrice;
            this.calculateSaleSimulation();
        }
    }

    calculateTotalPaidAmount(loanAmount, interestRate, loanPeriod, targetYear) {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanPeriod * 12;
        const targetMonths = targetYear * 12;
        
        if (monthlyRate === 0) {
            const monthlyPayment = loanAmount / totalPayments;
            const totalPrincipal = monthlyPayment * targetMonths;
            return {
                total: totalPrincipal,
                principal: totalPrincipal,
                interest: 0
            };
        }
        
        const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
            (Math.pow(1 + monthlyRate, totalPayments) - 1);
        
        let remainingBalance = loanAmount;
        let totalPrincipal = 0;
        let totalInterest = 0;
        
        for (let month = 0; month < targetMonths && remainingBalance > 0; month++) {
            const interestPayment = remainingBalance * monthlyRate;
            const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);
            
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
            remainingBalance -= principalPayment;
        }
        
        return {
            total: totalPrincipal + totalInterest,
            principal: totalPrincipal,
            interest: totalInterest
        };
    }

    displaySaleSimulation(results) {
        this.saleResults.style.display = 'block';
        
        const saleYear = parseInt(this.saleYearInput.value);
        const saleMonths = saleYear * 12;
        
        // 変動金利の実質利益/損失の表示
        const variableTotalGainLossElement = document.getElementById('variableTotalGainLoss');
        const variableGainLossNoteElement = document.getElementById('variableGainLossNote');
        const variableSummaryItem = document.querySelector('.sale-summary-item.variable-result');
        
        variableTotalGainLossElement.textContent = this.formatCurrency(Math.abs(results.variable.totalGainLoss));
        
        if (results.variable.totalGainLoss >= 0) {
            variableGainLossNoteElement.textContent = `${this.formatJapaneseUnits(results.variable.totalGainLoss)}の利益`;
            variableSummaryItem.className = 'sale-summary-item variable-result profit';
        } else {
            const yearlyLoss = Math.abs(results.variable.totalGainLoss) / saleYear;
            const monthlyLoss = Math.abs(results.variable.totalGainLoss) / saleMonths;
            variableGainLossNoteElement.innerHTML = `${this.formatJapaneseUnits(Math.abs(results.variable.totalGainLoss))}の損失<br><small>年間${this.formatCurrency(yearlyLoss)}・月間${this.formatCurrency(monthlyLoss)}</small>`;
            variableSummaryItem.className = 'sale-summary-item variable-result loss';
        }
        
        // 固定金利の実質利益/損失の表示
        const fixedTotalGainLossElement = document.getElementById('fixedTotalGainLoss');
        const fixedGainLossNoteElement = document.getElementById('fixedGainLossNote');
        const fixedSummaryItem = document.querySelector('.sale-summary-item.fixed-result');
        
        fixedTotalGainLossElement.textContent = this.formatCurrency(Math.abs(results.fixed.totalGainLoss));
        
        if (results.fixed.totalGainLoss >= 0) {
            fixedGainLossNoteElement.textContent = `${this.formatJapaneseUnits(results.fixed.totalGainLoss)}の利益`;
            fixedSummaryItem.className = 'sale-summary-item fixed-result profit';
        } else {
            const yearlyLoss = Math.abs(results.fixed.totalGainLoss) / saleYear;
            const monthlyLoss = Math.abs(results.fixed.totalGainLoss) / saleMonths;
            fixedGainLossNoteElement.innerHTML = `${this.formatJapaneseUnits(Math.abs(results.fixed.totalGainLoss))}の損失<br><small>年間${this.formatCurrency(yearlyLoss)}・月間${this.formatCurrency(monthlyLoss)}</small>`;
            fixedSummaryItem.className = 'sale-summary-item fixed-result loss';
        }
        
        // 詳細内訳の表示（具体的な計算式付き）
        this.updateBreakdownItem('saleGrossPrice', results.salePrice, '設定した売却価格');
        
        // 売却手数料の詳細計算式
        this.updateBreakdownItem('saleFees', results.saleFees, 
            `(${this.formatNumber(results.salePrice)}万円×3%+6万円)×1.1+印紙税+その他費用`);
        
        // 売却手取りの計算式
        this.updateBreakdownItem('saleNetPrice', results.saleNetPrice, 
            `${this.formatNumber(results.salePrice)}万円 - ${this.formatNumber(results.saleFees)}万円`);
        
        // 残債額（変動金利と固定金利の平均または代表値）
        const avgRemainingLoan = (results.variable.remainingLoan + results.fixed.remainingLoan) / 2;
        this.updateBreakdownItem('remainingLoan', avgRemainingLoan, 
            `${parseInt(this.saleYearInput.value)}年後のローン残高（変動:${this.formatNumber(results.variable.remainingLoan)}万円、固定:${this.formatNumber(results.fixed.remainingLoan)}万円）`);
        
        // これまでの返済額（変動金利と固定金利の平均または代表値）
        const avgTotalPaid = (results.variable.totalPaid + results.fixed.totalPaid) / 2;
        const avgPrincipalPaid = (results.variable.principalPaid + results.fixed.principalPaid) / 2;
        const avgInterestPaid = (results.variable.interestPaid + results.fixed.interestPaid) / 2;
        
        this.updateBreakdownItem('totalPaid', avgTotalPaid, 
            `元本:${this.formatNumber(avgPrincipalPaid)}万円 + 利息:${this.formatNumber(avgInterestPaid)}万円 = 計:${this.formatNumber(avgTotalPaid)}万円（変動金利:${this.formatNumber(results.variable.totalPaid)}万円、固定金利:${this.formatNumber(results.fixed.totalPaid)}万円）`);
        
        // 元本返済分の表示
        this.updateBreakdownItem('principalPaid', avgPrincipalPaid, 
            `変動金利:${this.formatNumber(results.variable.principalPaid)}万円、固定金利:${this.formatNumber(results.fixed.principalPaid)}万円`);
        
        // 利息支払分の表示
        this.updateBreakdownItem('interestPaid', avgInterestPaid, 
            `変動金利:${this.formatNumber(results.variable.interestPaid)}万円、固定金利:${this.formatNumber(results.fixed.interestPaid)}万円`);
        
        // 購入時手数料
        this.updateBreakdownItem('purchaseFees', results.purchaseFees, 
            '購入時の取引手数料合計');
        
        // 維持費累計
        const annualMaintenance = results.maintenanceTotal / saleYear;
        this.updateBreakdownItem('maintenanceTotal', results.maintenanceTotal, 
            `${this.formatNumber(annualMaintenance)}万円/年 × ${saleYear}年`);
    }

    updateBreakdownItem(elementId, value, formula) {
        document.getElementById(elementId).textContent = this.formatCurrency(value);
        
        // 対応する計算式要素を更新
        const breakdownItem = document.getElementById(elementId).closest('.breakdown-item');
        const formulaElement = breakdownItem.querySelector('.breakdown-label small');
        if (formulaElement) {
            formulaElement.textContent = formula;
        }
    }

    calculatePairLoanHousingDeduction(loanAmount, loanPeriod, homeType = 'energy-efficient', interestRate = 1.0, ratios) {
        const husbandLoanAmount = loanAmount * (ratios.husband / 100);
        const wifeLoanAmount = loanAmount * (ratios.wife / 100);
        
        const husbandDeduction = this.calculateHousingLoanDeduction(husbandLoanAmount, loanPeriod, homeType, interestRate);
        const wifeDeduction = this.calculateHousingLoanDeduction(wifeLoanAmount, loanPeriod, homeType, interestRate);
        
        return {
            husband: husbandDeduction,
            wife: wifeDeduction,
            totalDeduction: husbandDeduction.totalDeduction + wifeDeduction.totalDeduction,
            homeType: homeType,
            deductionPeriod: Math.max(husbandDeduction.deductionPeriod, wifeDeduction.deductionPeriod)
        };
    }

    handleScenarioChange() {
        const scenario = this.variableScenarioSelect.value;
        
        // 最高金利入力欄の表示/非表示
        if (scenario === 'fixed') {
            this.simulationDetails.style.display = 'none';
        } else {
            this.simulationDetails.style.display = 'flex';
        }
        
        // シナリオ解説の更新
        this.updateScenarioDescription(scenario);
        
        this.calculateAndDisplay();
    }

    updateScenarioDescription(scenario) {
        const descriptions = {
            'fixed': '金利固定でシミュレーション',
            'gradual-increase': 'ローン期間中に金利が段階的に上昇するシナリオ。経済成長に伴って徐々に金利が上がる場合を想定。',
            'sudden-increase': '最初の5年間は低金利、その後急激に高金利になるシナリオ。日銀の金融政策転換などを想定。',
            'fluctuation': '10年周期で金利が上下に変動するシナリオ。景気循環による金利変動を想定。'
        };
        
        this.scenarioDescription.textContent = descriptions[scenario] || descriptions['fixed'];
    }

    generateVariableRateSchedule(initialRate, maxRate, loanPeriod, scenario) {
        const schedule = [];
        
        switch (scenario) {
            case 'fixed':
                for (let year = 0; year <= loanPeriod; year++) {
                    schedule.push(initialRate);
                }
                break;
                
            case 'gradual-increase':
                for (let year = 0; year <= loanPeriod; year++) {
                    const progress = year / loanPeriod;
                    const rate = initialRate + (maxRate - initialRate) * progress;
                    schedule.push(Math.min(rate, maxRate));
                }
                break;
                
            case 'sudden-increase':
                for (let year = 0; year <= loanPeriod; year++) {
                    if (year <= 5) {
                        schedule.push(initialRate);
                    } else {
                        schedule.push(maxRate);
                    }
                }
                break;
                
            case 'fluctuation':
                for (let year = 0; year <= loanPeriod; year++) {
                    const cyclePosition = (year * 2 * Math.PI) / 10; // 10年周期
                    const fluctuation = Math.sin(cyclePosition) * (maxRate - initialRate) * 0.5;
                    const baseRate = (initialRate + maxRate) / 2;
                    schedule.push(Math.max(0.1, baseRate + fluctuation));
                }
                break;
                
            default:
                for (let year = 0; year <= loanPeriod; year++) {
                    schedule.push(initialRate);
                }
        }
        
        return schedule;
    }

    calculateVariableLoanDetails(loanAmount, initialRate, maxRate, loanPeriod, scenario) {
        const rateSchedule = this.generateVariableRateSchedule(initialRate, maxRate, loanPeriod, scenario);
        const balanceData = [];
        const annualPaymentData = [];
        const cumulativePaymentData = [];
        let remainingBalance = loanAmount;
        let totalPayment = 0;
        let totalInterest = 0;
        let monthlyPayments = [];
        let cumulativePayment = 0;
        
        // 月次ベースで計算
        for (let month = 0; month <= loanPeriod * 12; month++) {
            const year = Math.floor(month / 12);
            
            if (month % 12 === 0) {
                // 年の始めに残高データを記録
                balanceData.push({
                    year: year,
                    balance: remainingBalance / 10000 // 万円単位
                });
                
                // 累積返済額データを記録
                cumulativePaymentData.push({
                    year: year,
                    payment: cumulativePayment / 10000 // 万円単位
                });
                
                // 年間返済額データを記録（0年目は除く）
                if (year > 0 && year <= loanPeriod) {
                    const currentRate = rateSchedule[year - 1];
                    const monthlyRate = currentRate / 100 / 12;
                    const remainingMonths = (loanPeriod - year + 1) * 12;
                    const balanceAtYearStart = balanceData[year - 1]?.balance * 10000 || 0;
                    
                    let yearlyPayment;
                    if (monthlyRate === 0) {
                        yearlyPayment = (balanceAtYearStart / remainingMonths) * 12;
                    } else {
                        const monthlyPayment = balanceAtYearStart * 
                            (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                            (Math.pow(1 + monthlyRate, remainingMonths) - 1);
                        yearlyPayment = monthlyPayment * 12;
                    }
                    
                    annualPaymentData.push({
                        year: year,
                        payment: yearlyPayment / 10000, // 万円単位
                        rate: currentRate
                    });
                }
            }
            
            if (month < loanPeriod * 12 && remainingBalance > 0.01) {
                const currentRate = rateSchedule[year];
                const monthlyRate = currentRate / 100 / 12;
                const remainingMonths = loanPeriod * 12 - month;
                
                let monthlyPayment;
                if (monthlyRate === 0) {
                    monthlyPayment = remainingBalance / remainingMonths;
                } else {
                    monthlyPayment = remainingBalance * 
                        (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                        (Math.pow(1 + monthlyRate, remainingMonths) - 1);
                }
                
                if (month === 0) {
                    monthlyPayments.push(monthlyPayment);
                }
                
                const interestPayment = remainingBalance * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                
                totalPayment += monthlyPayment;
                totalInterest += interestPayment;
                cumulativePayment += monthlyPayment;
                remainingBalance = Math.max(0, remainingBalance - principalPayment);
            }
        }
        
        // 初年度の月々返済額を代表値として返す
        const representativeMonthlyPayment = monthlyPayments.length > 0 ? monthlyPayments[0] : 0;
        
        return {
            loanAmount: loanAmount / 10000, // 万円単位
            monthlyPayment: representativeMonthlyPayment / 10000, // 万円単位
            totalPayment: totalPayment / 10000, // 万円単位
            totalInterest: totalInterest / 10000, // 万円単位
            balanceData: balanceData,
            cumulativePaymentData: cumulativePaymentData,
            annualPaymentData: annualPaymentData,
            monthlyPayments: monthlyPayments
        };
    }

    calculateVariableLoanBalance(loanAmount, initialRate, maxRate, loanPeriod, scenario) {
        const details = this.calculateVariableLoanDetails(loanAmount, initialRate, maxRate, loanPeriod, scenario);
        return details.balanceData;
    }

    calculateLoanBalance(loanAmount, interestRate, loanPeriod) {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanPeriod * 12;
        const balanceData = [];
        
        if (monthlyRate === 0) {
            // 金利0%の場合
            const monthlyPayment = loanAmount / totalPayments;
            for (let year = 0; year <= loanPeriod; year++) {
                const remainingBalance = loanAmount - (monthlyPayment * year * 12);
                balanceData.push({
                    year: year,
                    balance: Math.max(0, remainingBalance / 10000) // 万円単位
                });
            }
        } else {
            // 通常の金利計算
            const monthlyPayment = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                (Math.pow(1 + monthlyRate, totalPayments) - 1);
            
            let remainingBalance = loanAmount;
            
            for (let year = 0; year <= loanPeriod; year++) {
                balanceData.push({
                    year: year,
                    balance: remainingBalance / 10000 // 万円単位
                });
                
                // 1年分の返済を計算
                for (let month = 0; month < 12 && remainingBalance > 0; month++) {
                    const interestPayment = remainingBalance * monthlyRate;
                    const principalPayment = monthlyPayment - interestPayment;
                    remainingBalance = Math.max(0, remainingBalance - principalPayment);
                }
            }
        }
        
        return balanceData;
    }

    calculateCumulativePayment(loanAmount, interestRate, loanPeriod) {
        const monthlyRate = interestRate / 100 / 12;
        const totalPayments = loanPeriod * 12;
        const cumulativeData = [];
        let cumulativePayment = 0;
        
        if (monthlyRate === 0) {
            // 金利0%の場合
            const monthlyPayment = loanAmount / totalPayments;
            for (let year = 0; year <= loanPeriod; year++) {
                cumulativeData.push({
                    year: year,
                    payment: cumulativePayment / 10000 // 万円単位
                });
                cumulativePayment += monthlyPayment * 12;
            }
        } else {
            // 通常の金利計算
            const monthlyPayment = loanAmount * 
                (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                (Math.pow(1 + monthlyRate, totalPayments) - 1);
            
            for (let year = 0; year <= loanPeriod; year++) {
                cumulativeData.push({
                    year: year,
                    payment: cumulativePayment / 10000 // 万円単位
                });
                
                // 1年分の返済を累積
                if (year < loanPeriod) {
                    cumulativePayment += monthlyPayment * 12;
                }
            }
        }
        
        return cumulativeData;
    }


    formatCurrency(amount) {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount * 10000);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('ja-JP').format(number);
    }

    formatJapaneseUnits(amount) {
        if (amount >= 10000) {
            const oku = amount / 10000;
            if (oku >= 10) {
                return new Intl.NumberFormat('ja-JP', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(oku) + '億円';
            } else {
                return new Intl.NumberFormat('ja-JP', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1
                }).format(oku) + '億円';
            }
        } else {
            return new Intl.NumberFormat('ja-JP', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount) + '万円';
        }
    }


    calculateAndDisplay() {
        const data = this.getFormData();
        const purchasePrice = this.calculatePurchasePrice(data);
        
        // 物件購入リンクを更新
        this.updatePropertyLinks(purchasePrice);
        
        if (purchasePrice === 0) {
            this.displayEmptyResults();
            return;
        }

        const variableRate = parseFloat(this.variableRateInput.value) || 0.8;
        const fixedRate = parseFloat(this.fixedRateInput.value) || 2.0;

        const scenario = this.variableScenarioSelect.value;
        const maxRate = parseFloat(this.maxRateInput.value) || 3.0;
        const loanAmount = (purchasePrice - data.downPayment) * 10000; // 円単位
        
        // 変動金利の詳細計算
        const variableDetails = this.calculateVariableLoanDetails(
            loanAmount, 
            variableRate, 
            maxRate, 
            data.loanPeriod, 
            scenario
        );

        const fixedLoanDetails = this.calculateLoanDetails(purchasePrice, data.downPayment, fixedRate, data.loanPeriod);

        const maintenanceCosts = this.calculateMaintenanceCosts(purchasePrice);
        
        // 取引手数料を計算
        const propertyType = this.propertyTypeSelect.value;
        const isPairLoan = this.isPairLoan();
        const ratios = isPairLoan ? this.getPairLoanRatios() : null;
        const transactionFees = this.calculateTransactionFees(purchasePrice, variableDetails.loanAmount, propertyType, isPairLoan, ratios);
        
        // 住宅ローン控除を計算
        const homeType = this.getSelectedHomeType();
        let housingLoanDeduction;
        if (isPairLoan) {
            const ratios = this.getPairLoanRatios();
            housingLoanDeduction = this.calculatePairLoanHousingDeduction(variableDetails.loanAmount, data.loanPeriod, homeType, variableRate, ratios);
        } else {
            housingLoanDeduction = this.calculateHousingLoanDeduction(variableDetails.loanAmount, data.loanPeriod, homeType, variableRate);
        }
        
        // 残債推移データを取得
        const variableBalanceData = variableDetails.balanceData;
        const fixedBalanceData = this.calculateLoanBalance(fixedLoanDetails.loanAmount * 10000, fixedRate, data.loanPeriod);
        
        // 累積返済額データを取得
        const variableCumulativeData = variableDetails.cumulativePaymentData;
        const fixedCumulativeData = this.calculateCumulativePayment(fixedLoanDetails.loanAmount * 10000, fixedRate, data.loanPeriod);

        this.displayResults({
            purchasePrice: purchasePrice,
            variableLoanDetails: {
                loanAmount: variableDetails.loanAmount,
                monthlyPayment: variableDetails.monthlyPayment,
                totalPayment: variableDetails.totalPayment + data.downPayment,
                totalInterest: variableDetails.totalInterest
            },
            fixedLoanDetails: fixedLoanDetails,
            maintenanceCosts: maintenanceCosts,
            transactionFees: transactionFees,
            balanceProjection: {
                variable: variableBalanceData,
                fixed: fixedBalanceData
            },
            cumulativePaymentProjection: {
                variable: variableCumulativeData,
                fixed: fixedCumulativeData
            },
            annualPaymentData: variableDetails.annualPaymentData,
            housingLoanDeduction: housingLoanDeduction
        });
    }

    displayResults(results) {
        // ローン条件セクション用の表示
        document.getElementById('purchasePriceCondition').textContent = this.formatCurrency(results.purchasePrice);
        document.getElementById('loanAmountCondition').textContent = this.formatCurrency(results.variableLoanDetails.loanAmount);

        this.displayRateResults('variable', results.variableLoanDetails);
        this.displayRateResults('fixed', results.fixedLoanDetails);

        // ペアローンの個別支払額を表示
        if (this.isPairLoan()) {
            this.displayPairLoanDetails();
        }

        // 維持費用を表示
        this.displayMaintenanceCosts(results.maintenanceCosts);

        // 住宅ローン控除を表示
        this.displayHousingLoanDeduction(results.housingLoanDeduction);
        this.displayHousingLoanDeductionInSection(results.housingLoanDeduction);

        // 取引手数料を表示
        this.displayTransactionFees(results.transactionFees);

        // データを保存
        this.lastResults = results;
        
        // 現在のビューに応じてチャートを描画
        this.redrawChart();
        this.generateComparisonTable(results.cumulativePaymentProjection);
        
        // 売却シミュレーションを更新
        this.calculateSaleSimulation();
    }

    switchView(view) {
        // ボタンの状態を更新
        this.chartToggle.classList.remove('active');
        this.dualToggle.classList.remove('active');
        this.tableToggle.classList.remove('active');
        
        if (view === 'chart') {
            this.chartContainer.style.display = 'block';
            this.tableContainer.style.display = 'none';
            this.chartToggle.classList.add('active');
            this.currentChartView = 'chart';
        } else if (view === 'dual') {
            this.chartContainer.style.display = 'block';
            this.tableContainer.style.display = 'none';
            this.dualToggle.classList.add('active');
            this.currentChartView = 'dual';
        } else {
            this.chartContainer.style.display = 'none';
            this.tableContainer.style.display = 'block';
            this.tableToggle.classList.add('active');
            this.currentChartView = 'table';
        }
        
        // チャートを再描画
        if (view !== 'table' && this.lastResults) {
            this.redrawChart();
        }
    }

    redrawChart() {
        if (!this.lastResults) return;
        
        if (this.currentChartView === 'chart') {
            this.drawCumulativePaymentChart(this.lastResults.cumulativePaymentProjection);
        } else if (this.currentChartView === 'dual') {
            this.drawDualAxisChart(this.lastResults.cumulativePaymentProjection, this.lastResults.annualPaymentData);
        }
    }

    generateComparisonTable(cumulativeProjection) {
        const tbody = this.comparisonTableBody;
        tbody.innerHTML = '';
        
        const maxLength = Math.max(
            cumulativeProjection.variable.length,
            cumulativeProjection.fixed.length
        );
        
        // 5年ごとにデータを表示
        for (let i = 0; i < maxLength; i += 5) {
            const variableData = cumulativeProjection.variable[i] || { year: i, payment: 0 };
            const fixedData = cumulativeProjection.fixed[i] || { year: i, payment: 0 };
            
            const diff = variableData.payment - fixedData.payment;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="year-col">${variableData.year}年</td>
                <td class="variable-col">${this.formatNumber(Math.round(variableData.payment))}万円</td>
                <td class="fixed-col">${this.formatNumber(Math.round(fixedData.payment))}万円</td>
                <td class="diff-col ${diff >= 0 ? 'diff-positive' : 'diff-negative'}">
                    ${diff >= 0 ? '+' : ''}${this.formatNumber(Math.round(diff))}万円
                </td>
            `;
            tbody.appendChild(row);
        }
    }

    displayRateResults(rateType, loanDetails) {
        document.getElementById(`${rateType}Monthly`).textContent = this.formatCurrency(loanDetails.monthlyPayment);
        document.getElementById(`${rateType}MonthlyJapanese`).textContent = this.formatJapaneseUnits(loanDetails.monthlyPayment);
        
        document.getElementById(`${rateType}Total`).textContent = this.formatCurrency(loanDetails.totalPayment);
        document.getElementById(`${rateType}TotalJapanese`).textContent = this.formatJapaneseUnits(loanDetails.totalPayment);
        
        document.getElementById(`${rateType}Interest`).textContent = this.formatCurrency(loanDetails.totalInterest);
        document.getElementById(`${rateType}InterestJapanese`).textContent = this.formatJapaneseUnits(loanDetails.totalInterest);
        
        // 変動金利の場合は注釈を更新
        if (rateType === 'variable') {
            const scenario = this.variableScenarioSelect.value;
            const noteElement = document.getElementById('variablePaymentNote');
            
            switch (scenario) {
                case 'fixed':
                    noteElement.textContent = '一般的に最も低い金利';
                    break;
                case 'gradual-increase':
                    noteElement.textContent = '初年度の返済額（段階的上昇）';
                    break;
                case 'sudden-increase':
                    noteElement.textContent = '初年度の返済額（5年後上昇）';
                    break;
                case 'fluctuation':
                    noteElement.textContent = '初年度の返済額（上下変動）';
                    break;
                default:
                    noteElement.textContent = '一般的に最も低い金利';
            }
        }
    }

    displayMaintenanceCosts(maintenanceCosts) {
        document.getElementById('propertyTax').textContent = this.formatCurrency(maintenanceCosts.propertyTax);
        document.getElementById('cityPlanningTax').textContent = this.formatCurrency(maintenanceCosts.cityPlanningTax);
        document.getElementById('fireInsurance').textContent = this.formatCurrency(maintenanceCosts.fireInsurance);
        document.getElementById('maintenanceFee').textContent = this.formatCurrency(maintenanceCosts.maintenanceFee);
    }

    displayHousingLoanDeduction(deduction) {
        // 住宅ローン控除の情報を税制優遇セクションに表示
        const taxBenefitsElement = document.getElementById('taxBenefits');
        
        // 既存のリストを一旦クリア
        taxBenefitsElement.innerHTML = '';
        
        // 住宅の種類による説明
        const homeTypeNames = {
            'certified': '認定住宅（借入限度額5,000万円）',
            'zeh': 'ZEH水準省エネ住宅（借入限度額4,500万円）',
            'energy-efficient': '省エネ基準適合住宅（借入限度額4,000万円）',
            'basic': '一般住宅（借入限度額2,000万円）'
        };
        
        // 住宅ローン控除の詳細を表示
        const housingLoanItem = document.createElement('li');
        
        if (this.isPairLoan() && deduction.husband && deduction.wife) {
            // ペアローンの場合
            housingLoanItem.innerHTML = `
                <strong>住宅ローン控除（ペアローン）：</strong><br>
                ・住宅種類：${homeTypeNames[deduction.homeType]}<br>
                ・控除期間：${deduction.deductionPeriod}年間<br>
                ・夫の控除総額：約${this.formatNumber(Math.round(deduction.husband.totalDeduction))}万円<br>
                ・妻の控除総額：約${this.formatNumber(Math.round(deduction.wife.totalDeduction))}万円<br>
                ・合計控除総額：約${this.formatNumber(Math.round(deduction.totalDeduction))}万円<br>
                ・年間控除額：それぞれの年末残高の0.7%（最大40万円/年・人）
            `;
        } else {
            // 単独ローンの場合
            housingLoanItem.innerHTML = `
                <strong>住宅ローン控除：</strong><br>
                ・住宅種類：${homeTypeNames[deduction.homeType]}<br>
                ・控除期間：${deduction.deductionPeriod}年間<br>
                ・控除総額：約${this.formatNumber(Math.round(deduction.totalDeduction))}万円<br>
                ・年間控除額：年末残高の0.7%（最大40万円/年）
            `;
        }
        
        taxBenefitsElement.appendChild(housingLoanItem);
        
        // その他の税制優遇
        const otherBenefits = [
            '住宅取得等資金の贈与税非課税：最大1,000万円',
            '不動産取得税の軽減措置',
            '登録免許税の軽減措置'
        ];
        
        otherBenefits.forEach(benefit => {
            const li = document.createElement('li');
            li.textContent = benefit;
            taxBenefitsElement.appendChild(li);
        });
    }

    displayHousingLoanDeductionInSection(deduction) {
        const singleLoanSection = document.getElementById('singleLoanDeduction');
        const pairLoanSection = document.getElementById('pairLoanDeduction');
        
        if (this.isPairLoan() && deduction.husband && deduction.wife) {
            // ペアローンの場合
            singleLoanSection.style.display = 'none';
            pairLoanSection.style.display = 'block';
            
            const ratios = this.getPairLoanRatios();
            
            // 割合を更新
            document.getElementById('husbandDeductionRatio').textContent = `${ratios.husband}%`;
            document.getElementById('wifeDeductionRatio').textContent = `${ratios.wife}%`;
            
            // 各控除額を表示
            document.getElementById('husbandDeductionAmount').textContent = 
                `約${this.formatNumber(Math.round(deduction.husband.totalDeduction))}万円`;
            document.getElementById('wifeDeductionAmount').textContent = 
                `約${this.formatNumber(Math.round(deduction.wife.totalDeduction))}万円`;
            document.getElementById('pairDeductionTotal').textContent = 
                `約${this.formatNumber(Math.round(deduction.totalDeduction))}万円`;
        } else {
            // 単独ローンの場合
            singleLoanSection.style.display = 'flex';
            pairLoanSection.style.display = 'none';
            
            const deductionAmountElement = document.getElementById('deductionTotalAmount');
            if (deductionAmountElement) {
                deductionAmountElement.textContent = `約${this.formatNumber(Math.round(deduction.totalDeduction))}万円`;
            }
        }
    }

    displayPairLoanDetails() {
        const ratios = this.getPairLoanRatios();
        const data = this.getFormData();
        const purchasePrice = this.calculatePurchasePrice(data);
        const loanAmount = (purchasePrice - data.downPayment) * 10000; // 円単位
        
        const variableRate = parseFloat(this.variableRateInput.value) || 0.8;
        const fixedRate = parseFloat(this.fixedRateInput.value) || 2.0;
        
        // 夫婦それぞれの借入額
        const husbandLoan = loanAmount * (ratios.husband / 100);
        const wifeLoan = loanAmount * (ratios.wife / 100);
        
        // 夫婦それぞれの月々返済額を計算
        const rates = [
            { type: 'variable', rate: variableRate },
            { type: 'fixed', rate: fixedRate },
        ];
        
        rates.forEach(rateInfo => {
            const husbandDetails = this.calculateLoanDetails(husbandLoan / 10000, 0, rateInfo.rate, data.loanPeriod);
            const wifeDetails = this.calculateLoanDetails(wifeLoan / 10000, 0, rateInfo.rate, data.loanPeriod);
            
            document.getElementById(`${rateInfo.type}HusbandMonthly`).textContent = this.formatCurrency(husbandDetails.monthlyPayment);
            document.getElementById(`${rateInfo.type}WifeMonthly`).textContent = this.formatCurrency(wifeDetails.monthlyPayment);
        });
    }

    displayTransactionFees(fees) {
        // 仲介手数料の表示
        const brokerageFeeElement = document.getElementById('brokerageFee');
        const brokerageLabelElement = brokerageFeeElement.parentElement.querySelector('.fee-label small');
        
        brokerageFeeElement.textContent = this.formatCurrency(fees.brokerageFee);
        brokerageLabelElement.textContent = fees.formulas.brokerageFee;
        
        // 登録免許税
        document.getElementById('registrationTax').textContent = this.formatCurrency(fees.registrationTax);
        document.getElementById('registrationTax').parentElement.querySelector('.fee-label small').textContent = fees.formulas.registrationTax;
        
        // 司法書士報酬
        document.getElementById('judicialScrivenerFee').textContent = this.formatCurrency(fees.judicialScrivenerFee);
        document.getElementById('judicialScrivenerFee').parentElement.querySelector('.fee-label small').textContent = fees.formulas.judicialScrivenerFee;
        
        // 不動産取得税
        document.getElementById('propertyAcquisitionTax').textContent = this.formatCurrency(fees.propertyAcquisitionTax);
        document.getElementById('propertyAcquisitionTax').parentElement.querySelector('.fee-label small').textContent = fees.formulas.propertyAcquisitionTax;
        
        // 印紙税
        document.getElementById('stampTax').textContent = this.formatCurrency(fees.stampTax);
        document.getElementById('stampTax').parentElement.querySelector('.fee-label small').textContent = fees.formulas.stampTax;
        
        // ローン関連費用
        document.getElementById('loanFees').textContent = this.formatCurrency(fees.loanFees);
        document.getElementById('loanFees').parentElement.querySelector('.fee-label small').textContent = fees.formulas.loanFees;
        
        // 合計
        document.getElementById('totalFees').textContent = this.formatCurrency(fees.totalFees);
        
        // ペアローン時の特別表示
        if (fees.isPairLoan) {
            this.updateFeesForPairLoan();
        } else {
            this.resetFeesForSingleLoan();
        }
    }

    updateFeesForPairLoan() {
        // 取引手数料セクションのタイトルを更新
        const feesTitle = document.querySelector('.transaction-fees h4');
        if (feesTitle) {
            feesTitle.textContent = '取引にかかる手数料（ペアローン）';
        }
        
        // ペアローン特有の説明を追加
        const feesGrid = document.querySelector('.fees-grid');
        let pairLoanNote = document.querySelector('.pair-loan-note');
        
        if (!pairLoanNote) {
            pairLoanNote = document.createElement('div');
            pairLoanNote.className = 'pair-loan-note';
            pairLoanNote.innerHTML = `
                <div class="pair-note-content">
                    <span class="pair-note-icon">👫</span>
                    <span class="pair-note-text">ペアローンでは夫婦それぞれがローン契約を行うため、司法書士報酬・印紙税・事務手数料が2名分発生します</span>
                </div>
            `;
            feesGrid.parentNode.insertBefore(pairLoanNote, feesGrid);
        }
    }

    resetFeesForSingleLoan() {
        // 取引手数料セクションのタイトルをリセット
        const feesTitle = document.querySelector('.transaction-fees h4');
        if (feesTitle) {
            feesTitle.textContent = '取引にかかる手数料';
        }
        
        // ペアローン特有の説明を削除
        const pairLoanNote = document.querySelector('.pair-loan-note');
        if (pairLoanNote) {
            pairLoanNote.remove();
        }
    }

    displayEmptyResults() {
        document.getElementById('purchasePrice').textContent = '-';
        document.getElementById('purchasePriceJapanese').textContent = '-';
        document.getElementById('loanAmount').textContent = '-';
        document.getElementById('loanAmountJapanese').textContent = '-';

        ['variable', 'fixed'].forEach(rateType => {
            document.getElementById(`${rateType}Monthly`).textContent = '-';
            document.getElementById(`${rateType}MonthlyJapanese`).textContent = '-';
            document.getElementById(`${rateType}Total`).textContent = '-';
            document.getElementById(`${rateType}TotalJapanese`).textContent = '-';
            document.getElementById(`${rateType}Interest`).textContent = '-';
            document.getElementById(`${rateType}InterestJapanese`).textContent = '-';
        });

        // 維持費用もリセット
        document.getElementById('propertyTax').textContent = '-';
        document.getElementById('cityPlanningTax').textContent = '-';
        document.getElementById('fireInsurance').textContent = '-';
        document.getElementById('maintenanceFee').textContent = '-';
        
        // 税制優遇もリセット
        const taxBenefitsElement = document.getElementById('taxBenefits');
        taxBenefitsElement.innerHTML = `
            <li>住宅ローン控除：年末残高の0.7%を所得税から控除</li>
            <li>住宅取得等資金の贈与税非課税：最大1,000万円</li>
            <li>不動産取得税の軽減措置</li>
            <li>登録免許税の軽減措置</li>
        `;

        const canvas = document.getElementById('assetChart');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('データを入力すると返済総額推移が表示されます', canvas.width / 2, canvas.height / 2);
    }

    drawBalanceChart(balanceProjection) {
        const canvas = document.getElementById('assetChart');
        const ctx = canvas.getContext('2d');
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const padding = 60;
        const chartWidth = canvasWidth - 2 * padding;
        const chartHeight = canvasHeight - 2 * padding;
        
        // 3つの金利タイプのデータを統合して最大値を計算
        const allData = [...balanceProjection.variable, ...balanceProjection.fixed];
        const maxValue = Math.max(...allData.map(item => item.balance));
        const minValue = 0; // 残債は0以下にならない
        const valueRange = maxValue - minValue;
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // グリッド線を描画
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const y = padding + (chartHeight / 10) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvasWidth - padding, y);
            ctx.stroke();
            
            const value = maxValue - (valueRange / 10) * i;
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(this.formatNumber(Math.round(value)), padding - 10, y + 4);
        }
        
        const maxYear = Math.max(
            balanceProjection.variable[balanceProjection.variable.length - 1].year,
            balanceProjection.fixed[balanceProjection.fixed.length - 1].year,
        );
        
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, canvasHeight - padding);
            ctx.stroke();
            
            const year = (maxYear / 6) * i;
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(year) + '年', x, canvasHeight - padding + 20);
        }
        
        // 変動金利の線を描画
        this.drawBalanceLine(ctx, balanceProjection.variable, '#3498db', padding, chartWidth, chartHeight, maxValue, maxYear);
        
        // 固定金利の線を描画
        this.drawBalanceLine(ctx, balanceProjection.fixed, '#27ae60', padding, chartWidth, chartHeight, maxValue, maxYear);
        
        
        // 凡例を描画
        this.drawLegend(ctx, canvasWidth, padding);
        
        // タイトルを描画
        ctx.fillStyle = '#343a40';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('残債額推移（万円）', canvasWidth / 2, 30);
        
        // Y軸ラベル
        ctx.save();
        ctx.translate(20, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('残債額', 0, 0);
        ctx.restore();
    }

    drawCumulativePaymentChart(cumulativeProjection) {
        const canvas = document.getElementById('assetChart');
        const ctx = canvas.getContext('2d');
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const padding = 60;
        const chartWidth = canvasWidth - 2 * padding;
        const chartHeight = canvasHeight - 2 * padding;
        
        // 3つの金利タイプのデータを統合して最大値を計算
        const allData = [...cumulativeProjection.variable, ...cumulativeProjection.fixed];
        const maxValue = Math.max(...allData.map(item => item.payment));
        const minValue = 0;
        const valueRange = maxValue - minValue;
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // グリッド線を描画
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const y = padding + (chartHeight / 10) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvasWidth - padding, y);
            ctx.stroke();
            
            const value = maxValue - (valueRange / 10) * i;
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(this.formatNumber(Math.round(value)), padding - 10, y + 4);
        }
        
        const maxYear = Math.max(
            cumulativeProjection.variable[cumulativeProjection.variable.length - 1].year,
            cumulativeProjection.fixed[cumulativeProjection.fixed.length - 1].year,
        );
        
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, canvasHeight - padding);
            ctx.stroke();
            
            const year = (maxYear / 6) * i;
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(year) + '年', x, canvasHeight - padding + 20);
        }
        
        // 変動金利の線を描画
        this.drawCumulativeLine(ctx, cumulativeProjection.variable, '#3498db', padding, chartWidth, chartHeight, maxValue, maxYear);
        
        // 固定金利の線を描画
        this.drawCumulativeLine(ctx, cumulativeProjection.fixed, '#27ae60', padding, chartWidth, chartHeight, maxValue, maxYear);
        
        
        // 凡例を描画
        this.drawLegend(ctx, canvasWidth, padding);
        
        // タイトルを描画
        ctx.fillStyle = '#343a40';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('返済総額推移（万円）', canvasWidth / 2, 30);
        
        // Y軸ラベル
        ctx.save();
        ctx.translate(20, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('返済総額', 0, 0);
        ctx.restore();
    }

    drawCumulativeLine(ctx, data, color, padding, chartWidth, chartHeight, maxValue, maxYear) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((item, index) => {
            const x = padding + (chartWidth / maxYear) * item.year;
            const y = padding + chartHeight - ((item.payment - 0) / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // データポイントを描画
        data.forEach((item, index) => {
            if (index % 5 === 0 || index === data.length - 1) {
                const x = padding + (chartWidth / maxYear) * item.year;
                const y = padding + chartHeight - ((item.payment - 0) / maxValue) * chartHeight;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    drawDualAxisChart(cumulativeProjection, annualPaymentData) {
        const canvas = document.getElementById('assetChart');
        const ctx = canvas.getContext('2d');
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const padding = 60;
        const chartWidth = canvasWidth - 2 * padding;
        const chartHeight = canvasHeight - 2 * padding;
        
        // 返済総額の最大値を計算
        const allCumulativeData = [...cumulativeProjection.variable, ...cumulativeProjection.fixed];
        const maxCumulative = Math.max(...allCumulativeData.map(item => item.payment));
        
        // 年間返済額の最大値を計算（データが空の場合のデフォルト値を設定）
        const maxPayment = annualPaymentData && annualPaymentData.length > 0 ? 
            Math.max(...annualPaymentData.map(item => item.payment)) : 100;
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 左軸（返済総額）のグリッド線
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            const y = padding + (chartHeight / 10) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvasWidth - padding, y);
            ctx.stroke();
            
            const value = maxCumulative - (maxCumulative / 10) * i;
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(this.formatNumber(Math.round(value)), padding - 10, y + 4);
        }
        
        // 右軸（年間返済額）の目盛り
        for (let i = 0; i <= 5; i++) {
            const value = (maxPayment / 5) * i;
            ctx.fillStyle = '#e74c3c';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            const y = padding + chartHeight - (chartHeight / 5) * i;
            ctx.fillText(this.formatNumber(Math.round(value)), canvasWidth - padding + 10, y + 4);
        }
        
        const maxYear = Math.max(
            cumulativeProjection.variable[cumulativeProjection.variable.length - 1].year,
            cumulativeProjection.fixed[cumulativeProjection.fixed.length - 1].year,
        );
        
        // X軸の目盛り
        for (let i = 0; i <= 6; i++) {
            const x = padding + (chartWidth / 6) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, canvasHeight - padding);
            ctx.stroke();
            
            const year = (maxYear / 6) * i;
            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(year) + '年', x, canvasHeight - padding + 20);
        }
        
        // 返済総額の線を描画（左軸）
        this.drawCumulativeLine(ctx, cumulativeProjection.variable, '#3498db', padding, chartWidth, chartHeight, maxCumulative, maxYear);
        this.drawCumulativeLine(ctx, cumulativeProjection.fixed, '#27ae60', padding, chartWidth, chartHeight, maxCumulative, maxYear);
        
        // 年間返済額の線を描画（右軸）
        if (annualPaymentData && annualPaymentData.length > 0) {
            this.drawPaymentLine(ctx, annualPaymentData, '#e74c3c', padding, chartWidth, chartHeight, maxPayment, maxYear);
        }
        
        // 凡例を描画
        this.drawDualLegend(ctx, canvasWidth, padding);
        
        // タイトルを描画
        ctx.fillStyle = '#343a40';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('返済総額推移 + 変動金利年間返済額', canvasWidth / 2, 30);
        
        // Y軸ラベル
        ctx.save();
        ctx.translate(20, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('返済総額', 0, 0);
        ctx.restore();
        
        // 右Y軸ラベル
        ctx.save();
        ctx.translate(canvasWidth - 20, canvasHeight / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#e74c3c';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('年間返済額', 0, 0);
        ctx.restore();
    }

    drawPaymentLine(ctx, data, color, padding, chartWidth, chartHeight, maxValue, maxYear) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // 破線で表示
        ctx.beginPath();
        
        data.forEach((item, index) => {
            const x = padding + (chartWidth / maxYear) * item.year;
            const y = padding + chartHeight - (item.payment / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        ctx.setLineDash([]); // 破線をリセット
        
        // データポイントを描画
        data.forEach((item, index) => {
            const x = padding + (chartWidth / maxYear) * item.year;
            const y = padding + chartHeight - (item.payment / maxValue) * chartHeight;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawDualLegend(ctx, canvasWidth, padding) {
        const legendItems = [
            { label: '変動金利（返済総額）', color: '#3498db', dash: false },
            { label: '固定金利（返済総額）', color: '#27ae60', dash: false },
            { label: '変動金利（年間返済額）', color: '#e74c3c', dash: true }
        ];
        
        const legendX = canvasWidth - 150;
        const legendY = padding + 20;
        
        legendItems.forEach((item, index) => {
            const y = legendY + index * 18;
            
            // 線を描画
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            if (item.dash) {
                ctx.setLineDash([5, 5]);
            }
            ctx.beginPath();
            ctx.moveTo(legendX, y);
            ctx.lineTo(legendX + 20, y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // ラベルを描画
            ctx.fillStyle = '#2c3e50';
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, legendX + 25, y + 4);
        });
    }

    drawBalanceLine(ctx, data, color, padding, chartWidth, chartHeight, maxValue, maxYear) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((item, index) => {
            const x = padding + (chartWidth / maxYear) * item.year;
            const y = padding + chartHeight - ((item.balance - 0) / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // データポイントを描画
        data.forEach((item, index) => {
            if (index % 5 === 0 || index === data.length - 1) {
                const x = padding + (chartWidth / maxYear) * item.year;
                const y = padding + chartHeight - ((item.balance - 0) / maxValue) * chartHeight;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    drawLegend(ctx, canvasWidth, padding) {
        const legendItems = [
            { label: '変動金利', color: '#3498db' },
            { label: '固定金利', color: '#27ae60' },
        ];
        
        const legendX = canvasWidth - 100;
        const legendY = padding + 20;
        
        legendItems.forEach((item, index) => {
            const y = legendY + index * 20;
            
            // 線を描画
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(legendX, y);
            ctx.lineTo(legendX + 20, y);
            ctx.stroke();
            
            // ラベルを描画
            ctx.fillStyle = '#2c3e50';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, legendX + 25, y + 4);
        });
    }

    // URL クエリパラメータ管理
    saveToURL() {
        const url = new URL(window.location);
        const budget = this.budgetInput.value;
        
        if (budget) {
            url.searchParams.set('budget', budget);
        } else {
            url.searchParams.delete('budget');
        }
        
        // URLを更新（ページリロードなし）
        window.history.replaceState({}, '', url);
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const budget = urlParams.get('budget');
        
        if (budget) {
            this.budgetInput.value = budget;
            this.updateBudgetButtonsState();
            // 初期化時にシミュレーションを実行
            setTimeout(() => {
                this.handleBudgetInput();
            }, 100);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RealEstateCalculator();
});