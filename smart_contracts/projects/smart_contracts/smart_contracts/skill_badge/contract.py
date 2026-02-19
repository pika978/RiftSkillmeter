from algopy import ARC4Contract, GlobalState, String, UInt64
from algopy import arc4, itxn, Txn, Global


class SkillBadge(ARC4Contract):
    """
    Mints ARC-69 Skill Badge NFTs on assessment completion (score >= 80%).
    Also manages $SKILL token distribution (learn-to-earn economy).

    PS04 Features 2 & 3:
      - Feature 2: Skill Badge NFT per assessment passed
      - Feature 3: $SKILL token rewards for learning actions

    Deployed on Algorand TestNet via AlgoKit.
    """

    admin: GlobalState[arc4.Address]
    skill_token_id: GlobalState[UInt64]  # $SKILL fungible ASA ID
    badges_issued: GlobalState[UInt64]

    @arc4.abimethod(create="require")
    def create_application(self, skill_token_asset_id: UInt64) -> None:
        """
        Initialise the contract.
        skill_token_asset_id: the ASA ID of the pre-created $SKILL token.
        """
        self.admin = arc4.Address(Txn.sender)
        self.skill_token_id = skill_token_asset_id
        self.badges_issued = UInt64(0)

    @arc4.abimethod
    def issue_skill_badge(
        self,
        recipient: arc4.Address,
        skill_name: String,
        score: UInt64,
        topic_hash: String,
    ) -> UInt64:
        """
        Mint one ARC-69 Skill Badge NFT to the recipient.
        Only callable by admin. Requires score >= 80.
        Returns the ASA ID of the newly minted badge.
        """
        assert Txn.sender == self.admin.value, "Unauthorized: only admin can issue badges"
        assert score >= UInt64(80), "Score must be >= 80% to earn a skill badge"

        # ARC-69 metadata in the note field — fully on-chain, verifiable via Indexer
        metadata = (
            '{"standard":"arc69",'
            '"type":"skill_badge",'
            '"skill":"' + skill_name + '",'
            '"score":' + score.__str__() + ","
            '"topic":"' + topic_hash + '"}'
        )

        # Inner transaction: create the Badge NFT
        asset_id = itxn.AssetConfig(
            total=1,
            decimals=0,
            unit_name="SBADGE",
            asset_name="SkillMeter | " + skill_name,
            manager=Global.current_application_address,
            note=metadata.encode(),
        ).submit().created_asset.id

        # Inner transaction: transfer badge to recipient
        itxn.AssetTransfer(
            xfer_asset=asset_id,
            asset_receiver=recipient,
            asset_amount=1,
        ).submit()

        self.badges_issued.value += 1
        return asset_id

    @arc4.abimethod
    def reward_tokens(
        self,
        recipient: arc4.Address,
        amount: UInt64,
        reason: String,  # 'concept' | 'daily_task' | 'assessment' | 'streak' | 'course'
    ) -> None:
        """
        Transfer $SKILL tokens from the contract treasury to a learner.
        Enforces a max of 100 tokens per reward to prevent abuse.
        """
        assert Txn.sender == self.admin.value, "Unauthorized: only admin can reward tokens"
        assert amount <= UInt64(100), "Max 100 $SKILL tokens per reward"

        # Transfer $SKILL fungible tokens from contract treasury to learner
        itxn.AssetTransfer(
            xfer_asset=self.skill_token_id.value,
            asset_receiver=recipient,
            asset_amount=amount,
            note=("SkillMeter reward: " + reason).encode(),
        ).submit()

    @arc4.abimethod(readonly=True)
    def get_badges_issued(self) -> UInt64:
        """Returns total badges minted by this contract."""
        return self.badges_issued.value

    @arc4.abimethod(readonly=True)
    def get_skill_token_id(self) -> UInt64:
        """Returns the configured $SKILL ASA ID."""
        return self.skill_token_id.value
