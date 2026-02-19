from algopy import ARC4Contract, GlobalState, String, UInt64
from algopy import arc4, itxn, Txn, Global


class SkillBadge(ARC4Contract):
    """
    Mints ARC-69 Skill Badge NFTs on assessment completion.
    Also manages $SKILL token distribution (Feature 3 built-in).
    """
    admin: GlobalState[arc4.Address]
    skill_token_id: GlobalState[UInt64]   # $SKILL ASA ID
    badges_issued: GlobalState[UInt64]

    @arc4.abimethod(create='require')
    def create_application(self, skill_token_asset_id: UInt64) -> None:
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
        assert Txn.sender == self.admin.value, 'Unauthorized'
        assert score >= UInt64(80), 'Score must be >= 80 to earn badge'

        metadata = (
            '{"standard":"arc69",'
            '"type":"skill_badge",'
            '"skill":"' + skill_name + '",'
            '"score":' + str(score) + ','
            '"topic":"' + topic_hash + '"}'
        )

        asset_id = itxn.AssetConfig(
            total=1,
            decimals=0,
            unit_name='BADGE',
            asset_name='SkillBadge | ' + skill_name,
            manager=Global.current_application_address,
            note=metadata,
        ).submit().created_asset.id

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
        reason: String,   # 'daily_task' | 'assessment' | 'streak' | 'course'
    ) -> None:
        assert Txn.sender == self.admin.value, 'Unauthorized'
        assert amount <= UInt64(100), 'Max 100 tokens per reward'

        # Transfer $SKILL from contract treasury to recipient
        itxn.AssetTransfer(
            xfer_asset=self.skill_token_id.value,
            asset_receiver=recipient,
            asset_amount=amount,
            note='SkillMeter reward: ' + reason,
        ).submit()
